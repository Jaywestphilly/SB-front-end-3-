/**
 * Stock Bloc Marketplace Base Mainnet USDC Transfer Engine
 *
 * Executes real ERC-20 USDC transfers on Base Mainnet (eip155:8453) from the
 * dedicated marketplace hot wallet (`MARKETPLACE_WALLET_KEY` / `MARKETPLACE_WALLET_ADDRESS`):
 *   - 90% seller payouts after verified delivery
 *   - 100% buyer refunds on failed seller delivery
 *
 * Safety & Security Guarantees:
 *   - NEVER logs, prints, or returns `MARKETPLACE_WALLET_KEY` or `MARKETPLACE_ADMIN_KEY`.
 *   - Sanitizes all caught RPC / signing errors before persistence or API responses.
 *   - Checks on-chain USDC balance before transferring so the wallet can never overdraft.
 *   - Enforces 3 attempts with exponential backoff so transient RPC hiccups do not lose payouts.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  isAddress,
  type Address,
  type Hex
} from 'viem';
import { base } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { BASE_USDC_CONTRACT, getX402RecipientAddress } from './x402PaymentService.js';

export const DEFAULT_BASE_RPC_URL = 'https://mainnet.base.org';
export const DEFAULT_MAX_TRANSFER_ATTEMPTS = 3;
export const DEFAULT_RETRY_DELAYS_MS = [1000, 3000];

const ERC20_USDC_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)'
]);

export interface UsdcTransferRequest {
  to: string;
  amountAtomic: bigint;
  saleId: string;
  kind: 'seller_payout' | 'buyer_refund';
}

export interface UsdcTransferResult {
  ok: true;
  txHash: string;
  attempts: number;
  from: string;
}

export interface UsdcTransferFailure {
  ok: false;
  error: string;
  attempts: number;
}

export type UsdcTransferOutcome = UsdcTransferResult | UsdcTransferFailure;

type TransferExecutorFn = (req: UsdcTransferRequest) => Promise<{ txHash: string; from?: string }>;
type BalanceReaderFn = (walletAddress: string) => Promise<bigint>;

let customTransferExecutorForTesting: TransferExecutorFn | null = null;
let customBalanceReaderForTesting: BalanceReaderFn | null = null;
let customRetryDelaysForTesting: number[] | null = null;

export function setMarketplacePayoutTestingHooks(opts: {
  transferExecutor?: TransferExecutorFn | null;
  balanceReader?: BalanceReaderFn | null;
  retryDelaysMs?: number[] | null;
}): void {
  if (opts.transferExecutor !== undefined) {
    customTransferExecutorForTesting = opts.transferExecutor;
  }
  if (opts.balanceReader !== undefined) {
    customBalanceReaderForTesting = opts.balanceReader;
  }
  if (opts.retryDelaysMs !== undefined) {
    customRetryDelaysForTesting = opts.retryDelaysMs;
  }
}

export function resetMarketplacePayoutTestingHooks(): void {
  customTransferExecutorForTesting = null;
  customBalanceReaderForTesting = null;
  customRetryDelaysForTesting = null;
}

/**
 * Strip any secrets (MARKETPLACE_WALLET_KEY, MARKETPLACE_ADMIN_KEY, or raw 64-hex private keys)
 * from error messages before logging or persisting to Firestore.
 */
export function sanitizeMarketplaceError(raw: unknown): string {
  let msg = raw instanceof Error ? raw.message : String(raw || 'Unknown transfer error');
  const secrets = [
    process.env.MARKETPLACE_WALLET_KEY,
    process.env.MARKETPLACE_ADMIN_KEY,
    process.env.RECEIPT_SIGNING_PRIVATE_KEY
  ].filter((s): s is string => typeof s === 'string' && s.trim().length >= 8);

  for (const secret of secrets) {
    const trimmed = secret.trim();
    const noPrefix = trimmed.startsWith('0x') ? trimmed.slice(2) : trimmed;
    if (trimmed) msg = msg.split(trimmed).join('[REDACTED]');
    if (noPrefix && noPrefix.length >= 8) msg = msg.split(noPrefix).join('[REDACTED]');
  }

  // Redact any private-key-like parameter strings if a library embeds them
  msg = msg.replace(/privateKey["']?\s*[:=]\s*["']?0x?[a-fA-F0-9]{32,64}["']?/gi, 'privateKey=[REDACTED]');
  return msg.slice(0, 500);
}

function normalizePrivateKey(raw?: string): Hex | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  const hex = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
  if (!/^0x[a-fA-F0-9]{64}$/.test(hex)) {
    return null;
  }
  return hex as Hex;
}

/**
 * Resolve the dedicated marketplace wallet address receiving buyer USDC payments
 * and sending 90% seller payouts / 100% buyer refunds.
 */
export function getMarketplaceWalletAddress(): string {
  const configured =
    process.env.MARKETPLACE_WALLET_ADDRESS?.trim() ||
    process.env.MARKETPLACE_ESCROW_ADDRESS?.trim();

  if (configured && isAddress(configured)) {
    return configured;
  }

  const normalizedKey = normalizePrivateKey(process.env.MARKETPLACE_WALLET_KEY);
  if (normalizedKey) {
    try {
      return privateKeyToAccount(normalizedKey).address;
    } catch {
      // Fall through to default recipient
    }
  }

  return getX402RecipientAddress();
}

export function isMarketplaceHotWalletConfigured(): boolean {
  if (customTransferExecutorForTesting) return true;
  return normalizePrivateKey(process.env.MARKETPLACE_WALLET_KEY) !== null;
}

function getBaseRpcUrl(): string {
  const configured = process.env.BASE_RPC_URL?.trim();
  return configured && /^https?:\/\//i.test(configured) ? configured : DEFAULT_BASE_RPC_URL;
}

export async function readMarketplaceUsdcBalanceAtomic(walletAddress: string = getMarketplaceWalletAddress()): Promise<bigint> {
  if (customBalanceReaderForTesting) {
    return customBalanceReaderForTesting(walletAddress);
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(getBaseRpcUrl(), { timeout: 20_000 })
  });

  const balance = await publicClient.readContract({
    address: BASE_USDC_CONTRACT as Address,
    abi: ERC20_USDC_ABI,
    functionName: 'balanceOf',
    args: [walletAddress as Address],
    authorizationList: undefined
  });

  return BigInt(balance);
}

async function executeSingleBaseUsdcTransfer(req: UsdcTransferRequest): Promise<{ txHash: string; from: string }> {
  if (!isAddress(req.to)) {
    throw new Error('Recipient wallet is not a valid EVM address on Base.');
  }
  if (req.amountAtomic <= 0n) {
    throw new Error('Transfer amountAtomic must be greater than zero.');
  }

  const fromAddress = getMarketplaceWalletAddress();

  // Optional injected balance guard in tests, or real on-chain balanceOf check in production
  if (customBalanceReaderForTesting) {
    const available = await customBalanceReaderForTesting(fromAddress);
    if (available < req.amountAtomic) {
      throw new Error(
        `Insufficient marketplace USDC balance (${available.toString()} atomic available, ${req.amountAtomic.toString()} required).`
      );
    }
  }

  if (customTransferExecutorForTesting) {
    const result = await customTransferExecutorForTesting(req);
    if (!result?.txHash || !/^0x[a-fA-F0-9]{64}$/.test(result.txHash)) {
      throw new Error('USDC transfer executor did not return a valid Base transaction hash.');
    }
    return { txHash: result.txHash, from: result.from || fromAddress };
  }

  const privateKey = normalizePrivateKey(process.env.MARKETPLACE_WALLET_KEY);
  if (!privateKey) {
    throw new Error(
      'MARKETPLACE_WALLET_KEY is not configured. Set MARKETPLACE_WALLET_KEY and MARKETPLACE_WALLET_ADDRESS to enable live Base USDC payouts and refunds.'
    );
  }

  const account = privateKeyToAccount(privateKey);
  const configuredAddr = process.env.MARKETPLACE_WALLET_ADDRESS?.trim();
  if (configuredAddr && isAddress(configuredAddr) && configuredAddr.toLowerCase() !== account.address.toLowerCase()) {
    throw new Error('MARKETPLACE_WALLET_ADDRESS does not match the signer derived from MARKETPLACE_WALLET_KEY.');
  }

  const rpcUrl = getBaseRpcUrl();
  const publicClient = createPublicClient({
    chain: base,
    transport: http(rpcUrl, { timeout: 25_000 })
  });

  // Safety check: confirm marketplace wallet holds enough USDC before broadcasting transfer
  const currentBalance = await publicClient.readContract({
    address: BASE_USDC_CONTRACT as Address,
    abi: ERC20_USDC_ABI,
    functionName: 'balanceOf',
    args: [account.address],
    authorizationList: undefined
  });

  if (BigInt(currentBalance) < req.amountAtomic) {
    throw new Error(
      `Insufficient marketplace USDC balance on Base (${BigInt(currentBalance).toString()} atomic available, ${req.amountAtomic.toString()} required).`
    );
  }

  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl, { timeout: 25_000 })
  });

  const txHash = await walletClient.writeContract({
    address: BASE_USDC_CONTRACT as Address,
    abi: ERC20_USDC_ABI,
    functionName: 'transfer',
    args: [req.to as Address, req.amountAtomic],
    account,
    chain: base
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
    timeout: 60_000
  });

  if (receipt.status !== 'success') {
    throw new Error(`Base USDC transfer transaction reverted on-chain (${txHash}).`);
  }

  return { txHash, from: account.address };
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a Base Mainnet USDC ERC-20 transfer with up to 3 attempts and exponential backoff.
 */
export async function executeUsdcTransferWithRetries(
  req: UsdcTransferRequest,
  maxAttempts: number = DEFAULT_MAX_TRANSFER_ATTEMPTS
): Promise<UsdcTransferOutcome> {
  const attemptsLimit = Math.max(1, Math.min(maxAttempts, 5));
  const retryDelays = customRetryDelaysForTesting ?? DEFAULT_RETRY_DELAYS_MS;
  let lastError = 'Transfer failed';

  for (let attempt = 1; attempt <= attemptsLimit; attempt++) {
    try {
      const { txHash, from } = await executeSingleBaseUsdcTransfer(req);
      return {
        ok: true,
        txHash,
        attempts: attempt,
        from
      };
    } catch (err: unknown) {
      lastError = sanitizeMarketplaceError(err);
      if (attempt < attemptsLimit) {
        const delayMs = retryDelays[attempt - 1] ?? retryDelays[retryDelays.length - 1] ?? 1000;
        await sleep(delayMs);
      }
    }
  }

  return {
    ok: false,
    error: lastError,
    attempts: attemptsLimit
  };
}
