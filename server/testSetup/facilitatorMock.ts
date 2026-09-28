import { vi } from 'vitest';

// ============================================================================
// Hermetic Coinbase CDP x402 Facilitator Mock for Test Suites
// Stubs network calls to https://api.cdp.coinbase.com/platform/v2/x402
// ============================================================================

export type FacilitatorVerifyHandler = (
  paymentPayload: any,
  paymentRequirements: any
) => Promise<any>;

export type FacilitatorSettleHandler = (
  paymentPayload: any,
  paymentRequirements: any
) => Promise<any>;

// Default: reject like the real facilitator does for invalid signatures or unauthorized calls
const defaultVerifyHandler: FacilitatorVerifyHandler = async () => {
  throw new Error('Facilitator verify failed (401): Unauthorized');
};

// Default: reject unless the test explicitly opts into a successful settlement path
const defaultSettleHandler: FacilitatorSettleHandler = async () => {
  throw new Error('Facilitator settle failed (400): Bad Request');
};

let currentVerifyHandler: FacilitatorVerifyHandler = defaultVerifyHandler;
let currentSettleHandler: FacilitatorSettleHandler = defaultSettleHandler;

export const mockFacilitatorVerify = vi.fn(async (paymentPayload: any, paymentRequirements: any) => {
  return currentVerifyHandler(paymentPayload, paymentRequirements);
});

export const mockFacilitatorSettle = vi.fn(async (paymentPayload: any, paymentRequirements: any) => {
  return currentSettleHandler(paymentPayload, paymentRequirements);
});

export function setFacilitatorVerifyHandler(handler: FacilitatorVerifyHandler) {
  currentVerifyHandler = handler;
}

export function setFacilitatorSettleHandler(handler: FacilitatorSettleHandler) {
  currentSettleHandler = handler;
}

export function resetFacilitatorMock() {
  currentVerifyHandler = defaultVerifyHandler;
  currentSettleHandler = defaultSettleHandler;
  mockFacilitatorVerify.mockClear();
  mockFacilitatorSettle.mockClear();
}

// Mock @coinbase/x402 facilitator client config factory
vi.mock('@coinbase/x402', () => ({
  facilitator: {
    url: 'https://api.cdp.coinbase.com/platform/v2/x402',
    createAuthHeaders: vi.fn().mockResolvedValue({ headers: {} })
  },
  createFacilitatorConfig: vi.fn(() => ({
    url: 'https://api.cdp.coinbase.com/platform/v2/x402',
    createAuthHeaders: vi.fn().mockResolvedValue({ headers: {} })
  }))
}));

// Mock @x402/core/http HTTPFacilitatorClient while preserving header encoders/decoders
vi.mock('@x402/core/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@x402/core/http')>();

  class MockHTTPFacilitatorClient {
    url: string;
    constructor(config?: any) {
      this.url = config?.url || 'https://api.cdp.coinbase.com/platform/v2/x402';
    }
    verify = mockFacilitatorVerify;
    settle = mockFacilitatorSettle;
    getSupported = vi.fn().mockResolvedValue({
      kinds: ['exact'],
      networks: ['eip155:8453'],
      assets: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913']
    });
  }

  return {
    ...actual,
    HTTPFacilitatorClient: MockHTTPFacilitatorClient
  };
});
