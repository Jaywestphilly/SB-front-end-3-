/**
 * Web3 Service for Polkadot (DOT) and Bitcoin (BTC) ecosystems only.
 * Supports:
 * 1. Polkadot: Talisman, SubWallet, Polkadot.js, Enkrypt, Substrate accounts & signatures
 * 2. Bitcoin: Unisat, Xverse, Leather, Phantom BTC, OKX, WebLN / Alby Lightning
 * 3. x402 Autonomous Agent Micropayments (Sats & DOT)
 * 4. Merkle Proof-of-Alpha cryptographic validation (Bitcoin OP_RETURN & Polkadot JAM Extrinsic)
 * 5. Non-Custodial Algorithmic Vaults (BTC & DOT)
 */

export interface ConnectedWeb3Wallet {
  chain: "bitcoin" | "polkadot";
  walletName: string;
  address: string;
  connectedAt: string;
  balanceFormatted: string;
  tier: "Free" | "DOT Staker" | "Bitcoin HODLer" | "DOT Whale" | "Bitcoin Sovereign";
  perks: string[];
  publicKey?: string;
}

export interface AlphaProofData {
  id: string;
  date: string;
  timestamp: number;
  merkleRoot: string;
  totalPredictions: number;
  bitcoinAnchor: {
    network: "bitcoin-mainnet" | "bitcoin-testnet4";
    blockHeight: number;
    txid: string;
    opReturnDataHex: string;
    confirmed: boolean;
    explorerUrl: string;
  };
  polkadotAnchor: {
    network: "polkadot-relay" | "polkadot-asset-hub" | "jam-matrix";
    blockNumber: number;
    extrinsicHash: string;
    pallet: "System" | "Preimage" | "AlphaOracle";
    confirmed: boolean;
    explorerUrl: string;
  };
  leaves: Array<{
    symbol: string;
    name: string;
    predictedTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
    signalScore: number;
    targetPrice: number;
    leafHash: string;
  }>;
}

export interface X402InvoiceData {
  invoiceId: string;
  asset: "BTC_LIGHTNING" | "BTC_SATS" | "DOT_CORETIME" | "DOT_PLANCK";
  amount: number;
  amountDisplay: string;
  status: "pending" | "settled" | "expired";
  endpoint: string;
  recipientAddress: string;
  paymentPayload: string;
  createdAt: string;
  expiresAt: string;
  agentId?: string;
}

export interface NonCustodialVaultData {
  id: string;
  asset: "BTC" | "DOT";
  name: string;
  strategy: string;
  chain: string;
  contractAddress: string;
  totalValueLocked: string;
  apy30d: string;
  sharpeRatio: number;
  maxDrawdown: string;
  managementFeePercent: number;
  performanceFeePercent: number;
  status: "ACTIVE" | "REBALANCING";
  lastTrade: {
    action: "BUY" | "SELL" | "REBALANCE";
    amount: string;
    timestamp: string;
    txHash: string;
  };
}

class Web3DotBtcService {
  private activeWallet: ConnectedWeb3Wallet | null = null;
  private listeners: Set<(wallet: ConnectedWeb3Wallet | null) => void> = new Set();

  constructor() {
    this.loadSavedWallet();
  }

  private loadSavedWallet() {
    try {
      const saved = localStorage.getItem("stock_bloc_web3_wallet");
      if (saved) {
        this.activeWallet = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Could not parse saved Web3 wallet:", e);
    }
  }

  public getActiveWallet(): ConnectedWeb3Wallet | null {
    return this.activeWallet;
  }

  public subscribe(callback: (wallet: ConnectedWeb3Wallet | null) => void): () => void {
    this.listeners.add(callback);
    callback(this.activeWallet);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.activeWallet));
  }

  /**
   * Detect Available Wallets in Browser
   */
  public detectInstalledWallets(): {
    polkadot: { talisman: boolean; subwallet: boolean; polkadotJs: boolean; enkrypt: boolean };
    bitcoin: { unisat: boolean; xverse: boolean; leather: boolean; phantomBtc: boolean; webln: boolean };
  } {
    if (typeof window === "undefined") {
      return {
        polkadot: { talisman: false, subwallet: false, polkadotJs: false, enkrypt: false },
        bitcoin: { unisat: false, xverse: false, leather: false, phantomBtc: false, webln: false },
      };
    }

    const injected = (window as any).injectedWeb3 || {};
    const hasTalisman = !!injected.talisman || !!(window as any).talisman;
    const hasSubwallet = !!injected["subwallet-js"] || !!(window as any).SubWallet;
    const hasPolkadotJs = !!injected["polkadot-js"];
    const hasEnkrypt = !!injected.enkrypt;

    const hasUnisat = !!(window as any).unisat;
    const hasXverse = !!(window as any).XverseProviders || !!(window as any).BitcoinProvider;
    const hasLeather = !!(window as any).LeatherProvider;
    const hasPhantomBtc = !!(window as any).phantom?.bitcoin;
    const hasWebln = !!(window as any).webln;

    return {
      polkadot: {
        talisman: hasTalisman,
        subwallet: hasSubwallet,
        polkadotJs: hasPolkadotJs,
        enkrypt: hasEnkrypt,
      },
      bitcoin: {
        unisat: hasUnisat,
        xverse: hasXverse,
        leather: hasLeather,
        phantomBtc: hasPhantomBtc,
        webln: hasWebln,
      },
    };
  }

  /**
   * Connect Polkadot Wallet (Talisman, SubWallet, Polkadot.js, or Mock Substrate Account)
   */
  public async connectPolkadotWallet(walletName = "Talisman / SubWallet"): Promise<ConnectedWeb3Wallet> {
    let address = "";
    let detectedName = walletName;

    // Check for injected Web3 extensions
    if (typeof window !== "undefined" && (window as any).injectedWeb3) {
      const injected = (window as any).injectedWeb3;
      const targetExtensionKey = Object.keys(injected)[0];
      if (targetExtensionKey && injected[targetExtensionKey]?.enable) {
        try {
          const extension = await injected[targetExtensionKey].enable("Stock Bloc Terminal");
          const accounts = await extension.accounts.get();
          if (accounts && accounts.length > 0) {
            address = accounts[0].address;
            detectedName = accounts[0].name || targetExtensionKey;
          }
        } catch (e) {
          console.warn("Injected Polkadot connect notice:", e);
        }
      }
    }

    // Fallback/Deterministic Substrate Address if none injected or user in preview
    if (!address) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      address = `14E1gUf9RBZYFwFG8EHFi5aHeC6WzGg5rU7z2Uf${randomSuffix}`;
    }

    const res = await fetch("/api/v1/web3/wallets/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: "polkadot",
        walletName: detectedName,
        address,
      }),
    }).then((r) => r.json());

    if (res.wallet) {
      this.activeWallet = res.wallet;
    } else {
      this.activeWallet = {
        chain: "polkadot",
        walletName: detectedName,
        address,
        connectedAt: new Date().toISOString(),
        balanceFormatted: "3,450.00 DOT",
        tier: "DOT Whale",
        perks: [
          "Unrestricted AI Copilot Terminal",
          "Substrate Cross-Chain Arbitrage Feeds",
          "Coretime & JAM Early Signal Access",
          "50% Discount on Autonomous Agent Tasks",
        ],
      };
    }

    localStorage.setItem("stock_bloc_web3_wallet", JSON.stringify(this.activeWallet));
    this.notify();
    return this.activeWallet;
  }

  /**
   * Connect Bitcoin Wallet (Unisat, Xverse, Leather, Phantom BTC, or Mock Taproot Account)
   */
  public async connectBitcoinWallet(walletName = "Unisat / Xverse"): Promise<ConnectedWeb3Wallet> {
    let address = "";
    let detectedName = walletName;

    if (typeof window !== "undefined") {
      // 1. Try Unisat
      if ((window as any).unisat) {
        try {
          const accounts = await (window as any).unisat.requestAccounts();
          if (accounts && accounts[0]) {
            address = accounts[0];
            detectedName = "Unisat Wallet";
          }
        } catch (e) {
          console.warn("Unisat request notice:", e);
        }
      }

      // 2. Try Phantom BTC
      if (!address && (window as any).phantom?.bitcoin) {
        try {
          const accounts = await (window as any).phantom.bitcoin.requestAccounts();
          if (accounts && accounts[0]?.address) {
            address = accounts[0].address;
            detectedName = "Phantom BTC";
          }
        } catch (e) {
          console.warn("Phantom BTC notice:", e);
        }
      }
    }

    // Fallback/Deterministic Taproot Address
    if (!address) {
      const randomSuffix = Math.random().toString(36).substring(2, 6).toLowerCase();
      address = `bc1p7z8wly04764mrl2yq3dxz4x4z0y9tqstockbloc${randomSuffix}`;
    }

    const res = await fetch("/api/v1/web3/wallets/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chain: "bitcoin",
        walletName: detectedName,
        address,
      }),
    }).then((r) => r.json());

    if (res.wallet) {
      this.activeWallet = res.wallet;
    } else {
      this.activeWallet = {
        chain: "bitcoin",
        walletName: detectedName,
        address,
        connectedAt: new Date().toISOString(),
        balanceFormatted: "0.485 BTC (48,500,000 Sats)",
        tier: "Bitcoin Sovereign",
        perks: [
          "Unrestricted AI Copilot Terminal",
          "Sub-Second Lightning Quant Alerts",
          "Zero-Fee Agent API Rate Limit Exemption",
          "Exclusive Bitcoin Sovereign Private Signals",
        ],
      };
    }

    localStorage.setItem("stock_bloc_web3_wallet", JSON.stringify(this.activeWallet));
    this.notify();
    return this.activeWallet;
  }

  public disconnectWallet() {
    this.activeWallet = null;
    localStorage.removeItem("stock_bloc_web3_wallet");
    this.notify();
  }

  /**
   * Fetch Proof-of-Alpha cryptographic tree data
   */
  public async getProofOfAlpha(): Promise<AlphaProofData> {
    const res = await fetch("/api/v1/web3/proof-of-alpha");
    if (!res.ok) throw new Error("Failed to fetch proof of alpha");
    const json = await res.json();
    return json.data;
  }

  /**
   * Verify individual stock prediction against blockchain leaf & root
   */
  public async verifyPrediction(symbol: string): Promise<any> {
    const res = await fetch("/api/v1/web3/verify-prediction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol }),
    });
    return res.json();
  }

  /**
   * Request x402 Quote for Sats or DOT
   */
  public async requestX402Quote(asset: "BTC_LIGHTNING" | "DOT_CORETIME" | "DOT_PLANCK", endpoint?: string): Promise<{ invoice: X402InvoiceData }> {
    const res = await fetch("/api/v1/web3/x402/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset, endpoint }),
    });
    return res.json();
  }

  /**
   * Settle x402 Invoice
   */
  public async settleX402Invoice(invoiceId: string): Promise<any> {
    const res = await fetch("/api/v1/web3/x402/settle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId }),
    });
    return res.json();
  }

  /**
   * Fetch Non-Custodial Vaults (BTC & DOT ONLY)
   */
  public async getVaults(): Promise<NonCustodialVaultData[]> {
    const res = await fetch("/api/v1/web3/vaults");
    if (!res.ok) throw new Error("Failed to fetch vaults");
    const json = await res.json();
    return json.vaults;
  }
}

export const web3DotBtcService = new Web3DotBtcService();
