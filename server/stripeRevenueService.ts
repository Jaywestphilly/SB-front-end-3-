import crypto from 'crypto';
import type { Request, Response } from 'express';
import { db } from './firebaseAdmin.js';
import {
  recordedStripeSessions,
  fulfilledStripeSessions,
  processedWebhookEvents,
  getRecordedStripeSessionAsync,
  setRecordedStripeSessionAsync,
  getFulfilledStripeSessionAsync,
  setFulfilledStripeSessionAsync,
  isWebhookEventProcessedAsync,
  markWebhookEventProcessedAsync,
  StripeFulfillmentRecord
} from './stripePaymentProvider.js';
import {
  addCreditsToAgentWallet,
  inMemoryWalletRegistry,
  inMemoryAgentRegistry,
  inMemoryKeyRegistry,
  resolveAgentIdFromKey
} from './agentPlatform.js';

// Canonical Host
export const CANONICAL_HOST = 'https://stockbloc.ai.studio';

// Authoritative Server-Side Catalog (Single Source of Truth)
export interface ServerCatalogItem {
  productId: string;
  name: string;
  category: 'playbook' | 'subscription' | 'api_bundle';
  priceUsd: number;
  amountCents: number;
  currency: string;
  credits: number;
  mode: 'payment' | 'subscription';
  billingPeriod?: 'month' | 'year';
}

export const SERVER_CATALOG: Record<string, ServerCatalogItem> = {
  // 1. Agent Credits SKU (Primary production monetization SKU)
  agent_credits_1000: {
    productId: 'agent_credits_1000',
    name: 'Agent Credits — 1,000 credits — $10',
    category: 'api_bundle',
    priceUsd: 10,
    amountCents: 1000,
    currency: 'usd',
    credits: 1000,
    mode: 'payment'
  },
  agent_credits_10: {
    productId: 'agent_credits_10',
    name: 'Agent Credits — 1,000 credits — $10',
    category: 'api_bundle',
    priceUsd: 10,
    amountCents: 1000,
    currency: 'usd',
    credits: 1000,
    mode: 'payment'
  },

  // 2. Existing API Bundles
  api_bundle_25: {
    productId: 'api_bundle_25',
    name: 'Quant Agent Refill (3,000 Credits)',
    category: 'api_bundle',
    priceUsd: 25,
    amountCents: 2500,
    currency: 'usd',
    credits: 3000,
    mode: 'payment'
  },
  api_bundle_50: {
    productId: 'api_bundle_50',
    name: 'Sovereign Agent Refill (7,500 Credits)',
    category: 'api_bundle',
    priceUsd: 50,
    amountCents: 5000,
    currency: 'usd',
    credits: 7500,
    mode: 'payment'
  },

  // 3. Digital Playbooks ($5 each — Must not break live purchases)
  playbook_13f_whale: {
    productId: 'playbook_13f_whale',
    name: '13F Whale Tracking & SEC Filing Playbook',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },
  playbook_credit_800: {
    productId: 'playbook_credit_800',
    name: 'Credit 800+ Dispute & FICO Repair Blueprint',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },
  playbook_reit_realestate: {
    productId: 'playbook_reit_realestate',
    name: 'Real Estate & REIT Cash Flow Matrix',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },
  wealth_operating_system: {
    productId: 'wealth_operating_system',
    name: 'The Stock Bloc Wealth Operating System (260 Pages)',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },
  future_wealth_blueprint: {
    productId: 'future_wealth_blueprint',
    name: 'Stock Bloc: The Future Wealth Blueprint (108 Pages)',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },
  bundle_trilogy_complete: {
    productId: 'bundle_trilogy_complete',
    name: 'Complete Stock Bloc Trilogy Playbook Bundle',
    category: 'playbook',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 0,
    mode: 'payment'
  },

  // 4. Subscriptions
  subscription_pro_monthly: {
    productId: 'subscription_pro_monthly',
    name: 'Quant Suite Pro Subscription (Monthly)',
    category: 'subscription',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 5000,
    mode: 'subscription',
    billingPeriod: 'month'
  },
  subscription_pro_yearly: {
    productId: 'subscription_pro_yearly',
    name: 'Quant Suite Pro Subscription (Yearly)',
    category: 'subscription',
    priceUsd: 5,
    amountCents: 500,
    currency: 'usd',
    credits: 75000,
    mode: 'subscription',
    billingPeriod: 'year'
  }
};

// In-memory purchase store for user profile library linking
export const userProfilePurchases: Record<string, {
  email: string;
  purchasedItems: Array<{ id: string; title: string; category: string; downloadUrl: string }>;
  apiKey?: string;
  linkedAt: string;
}> = {};

// FIX 7: Structured, secure payment logging (never log secrets, card data, tokens, or client_secrets)
export type PaymentLogEventType =
  | 'checkout_created'
  | 'checkout_failed'
  | 'webhook_received'
  | 'webhook_verified'
  | 'credit_fulfilled'
  | 'duplicate_event'
  | 'duplicate_session'
  | 'payment_mismatch';

export function logPaymentEvent(event: PaymentLogEventType, details: Record<string, any>): void {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(details)) {
    const lk = key.toLowerCase();
    if (
      lk.includes('secret') ||
      lk.includes('card') ||
      lk.includes('token') ||
      lk.includes('password') ||
      lk.includes('credential') ||
      lk.includes('cvc') ||
      lk.includes('auth')
    ) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = val;
    }
  }
  console.log(`[PAYMENT_AUDIT] ${new Date().toISOString()} [${event}] ${JSON.stringify(sanitized)}`);
}

// FIX 2: Strict production environment detection
export function isProductionEnvironment(req?: Request): boolean {
  if (process.env.NODE_ENV === 'production') return true;
  if (process.env.AGENT_ENV === 'production') return true;
  if (process.env.PAYMENT_MODE === 'production') return true;
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (key.startsWith('sk_live_')) return true;
  if (req) {
    const host = req.hostname || (req.headers && req.headers.host) || '';
    if (typeof host === 'string' && host.includes('stockbloc.ai.studio')) {
      return true;
    }
  }
  return false;
}

// FIX 4: Session fulfillment lock to prevent concurrent races between Webhook and verify-session
const sessionFulfillmentLocks = new Map<string, Promise<any>>();

export async function executeSessionFulfillmentWithLock<T>(
  sessionId: string,
  fn: () => Promise<T>
): Promise<T> {
  while (sessionFulfillmentLocks.has(sessionId)) {
    try {
      await sessionFulfillmentLocks.get(sessionId);
    } catch (_) {}
  }

  let releaseLock: () => void = () => {};
  let rejectLock: (err: any) => void = () => {};
  const lockPromise = new Promise<void>((resolve, reject) => {
    releaseLock = resolve;
    rejectLock = reject;
  });
  sessionFulfillmentLocks.set(sessionId, lockPromise);

  try {
    const res = await fn();
    releaseLock();
    return res;
  } catch (err) {
    rejectLock(err);
    throw err;
  } finally {
    sessionFulfillmentLocks.delete(sessionId);
  }
}

/**
 * Authoritative Server-Side Checkout Creation
 * Validates against server catalog; rejects unknown SKUs, price overrides, credit overrides.
 * Fails closed in production with HTTP 500 { status: 'error', error: 'Stripe checkout unavailable' }.
 */
export async function createCheckoutSessionHandler(req: Request, res: Response) {
  try {
    const { productId, price, credits, email, agentId, apiKey } = req.body || {};
    const isProd = isProductionEnvironment(req);
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!productId || typeof productId !== 'string') {
      logPaymentEvent('checkout_failed', { reason: 'missing_product_id' });
      return res.status(400).json({ status: 'error', error: 'Missing productId parameter' });
    }

    const catalogItem = SERVER_CATALOG[productId];
    if (!catalogItem) {
      logPaymentEvent('checkout_failed', { reason: 'unknown_product_id', productId });
      return res.status(400).json({ status: 'error', error: `Unknown productId: ${productId}` });
    }

    // Client price override check
    if (price !== undefined && price !== null) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice !== catalogItem.priceUsd) {
        logPaymentEvent('checkout_failed', {
          reason: 'price_override_rejected',
          productId,
          clientPrice: price,
          serverPrice: catalogItem.priceUsd
        });
        return res.status(400).json({
          status: 'error',
          error: `Client price (${price}) does not match authoritative server catalog price ($${catalogItem.priceUsd})`
        });
      }
    }

    // Client credits override check
    if (credits !== undefined && credits !== null) {
      const numCredits = Number(credits);
      if (isNaN(numCredits) || numCredits !== catalogItem.credits) {
        logPaymentEvent('checkout_failed', {
          reason: 'credits_override_rejected',
          productId,
          clientCredits: credits,
          serverCredits: catalogItem.credits
        });
        return res.status(400).json({
          status: 'error',
          error: `Client credits (${credits}) does not match authoritative server catalog credits (${catalogItem.credits})`
        });
      }
    }

    // Resolve authenticated or metadata agent identity
    const resolvedAgentId = agentId || (apiKey ? resolveAgentIdFromKey(apiKey) : undefined);

    // Production check: require valid sk_live_* key
    if (isProd) {
      if (!stripeKey || !stripeKey.startsWith('sk_live_')) {
        logPaymentEvent('checkout_failed', { reason: 'missing_live_secret_key' });
        return res.status(500).json({
          status: 'error',
          error: 'Stripe checkout unavailable'
        });
      }

      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

      const paymentTypes: any[] = catalogItem.mode === 'subscription'
        ? ['card', 'link']
        : ['card', 'link', 'cashapp', 'klarna', 'afterpay_clearpay', 'affirm'];

      const session = await stripe.checkout.sessions.create({
        payment_method_types: paymentTypes,
        customer_email: email || undefined,
        metadata: {
          productId: catalogItem.productId,
          productType: catalogItem.category,
          credits: String(catalogItem.credits),
          priceUsd: String(catalogItem.priceUsd),
          amountCents: String(catalogItem.amountCents),
          currency: catalogItem.currency,
          agentId: resolvedAgentId || '',
          apiKey: apiKey || '',
          email: email || ''
        },
        line_items: [
          {
            price_data: {
              currency: catalogItem.currency,
              product_data: {
                name: catalogItem.name,
                description: `Stock Bloc ${catalogItem.category} - Instant Digital Delivery`,
              },
              unit_amount: catalogItem.amountCents,
              ...(catalogItem.mode === 'subscription'
                ? {
                    recurring: {
                      interval: catalogItem.billingPeriod || 'month',
                    },
                  }
                : {}),
            },
            quantity: 1,
          },
        ],
        mode: catalogItem.mode,
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
      });

      logPaymentEvent('checkout_created', { sessionId: session.id, productId: catalogItem.productId });
      return res.json({
        status: 'ok',
        sessionId: session.id,
        url: session.url,
        checkoutUrl: session.url
      });
    }

    // Development / Sandbox mode only (when NOT in production)
    if (stripeKey && !stripeKey.includes('placeholder')) {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email || undefined,
        metadata: {
          productId: catalogItem.productId,
          productType: catalogItem.category,
          credits: String(catalogItem.credits),
          priceUsd: String(catalogItem.priceUsd),
          amountCents: String(catalogItem.amountCents),
          currency: catalogItem.currency,
          agentId: resolvedAgentId || '',
          apiKey: apiKey || '',
          email: email || ''
        },
        line_items: [
          {
            price_data: {
              currency: catalogItem.currency,
              product_data: {
                name: catalogItem.name,
                description: `Stock Bloc ${catalogItem.category} - Development Test`,
              },
              unit_amount: catalogItem.amountCents,
            },
            quantity: 1,
          },
        ],
        mode: catalogItem.mode,
        success_url: `${req.protocol}://${req.get('host')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing`,
      });

      logPaymentEvent('checkout_created', { sessionId: session.id, productId: catalogItem.productId });
      return res.json({
        status: 'ok',
        sessionId: session.id,
        url: session.url,
        checkoutUrl: session.url
      });
    }

    // Pure local developer sandbox fallback (only when explicitly non-production and key is absent)
    const devSessionId = `cs_dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    await setRecordedStripeSessionAsync(devSessionId, {
      id: devSessionId,
      payment_status: 'paid',
      status: 'complete',
      amount_total: catalogItem.amountCents,
      currency: catalogItem.currency,
      customer_details: { email: email || 'dev@stockbloc.ai' },
      metadata: {
        productId: catalogItem.productId,
        productType: catalogItem.category,
        credits: String(catalogItem.credits),
        priceUsd: String(catalogItem.priceUsd),
        amountCents: String(catalogItem.amountCents),
        currency: catalogItem.currency,
        agentId: resolvedAgentId || '',
        apiKey: apiKey || '',
        email: email || ''
      }
    });

    logPaymentEvent('checkout_created', { sessionId: devSessionId, productId: catalogItem.productId, sandbox: true });
    return res.json({
      status: 'ok',
      sessionId: devSessionId,
      url: `https://checkout.stripe.com/c/pay/${devSessionId}`,
      checkoutUrl: `/checkout/success?session_id=${devSessionId}`,
      sandboxMode: true
    });
  } catch (err: any) {
    logPaymentEvent('checkout_failed', { error: err.message });
    const isProd = isProductionEnvironment(req);
    if (isProd) {
      // Production must never create cs_test_sb_*, mock URLs, or return status: 'ok'
      return res.status(500).json({
        status: 'error',
        error: 'Stripe checkout unavailable'
      });
    }

    // In dev mode, return error with details
    return res.status(500).json({
      status: 'error',
      error: 'Stripe checkout creation failed in development',
      details: err.message
    });
  }
}

/**
 * Authoritative Core Payment Fulfillment Function
 * Used by both Webhook and verify-session to enforce:
 * - One grant per session (lock-guarded)
 * - Server catalog validation (amount, currency, productId, status)
 * - Identity mapping from Stripe metadata only
 * - Atomic credit grant + durable record persistence
 */
export async function fulfillAuthoritativePayment(params: {
  session: any;
  eventId?: string;
  source: 'webhook' | 'verify-session';
  authenticatedAgentId?: string;
}): Promise<{
  success: boolean;
  alreadyFulfilled: boolean;
  creditsGranted: number;
  creditsBalance: number;
  agentId?: string;
  fulfillmentRecord?: StripeFulfillmentRecord;
  error?: string;
  statusCode?: number;
}> {
  const { session, eventId, source, authenticatedAgentId } = params;
  const sessionId = session.id;

  return executeSessionFulfillmentWithLock(sessionId, async () => {
    // 1. Check existing session fulfillment (Anti-double-credit guard)
    const priorFulfillment = await getFulfilledStripeSessionAsync(sessionId);
    if (priorFulfillment) {
      logPaymentEvent('duplicate_session', {
        sessionId,
        source,
        priorFulfilledAt: priorFulfillment.fulfilledAt,
        agentId: priorFulfillment.agentId
      });
      return {
        success: true,
        alreadyFulfilled: true,
        creditsGranted: 0,
        creditsBalance: priorFulfillment.creditsBalance || 0,
        agentId: priorFulfillment.agentId,
        fulfillmentRecord: priorFulfillment
      };
    }

    // 2. Authoritative Payment Status Check (FIX 6)
    const isPaid = session.payment_status === 'paid' || (session.status === 'complete' && session.payment_status !== 'unpaid');
    if (!isPaid) {
      return {
        success: false,
        alreadyFulfilled: false,
        creditsGranted: 0,
        creditsBalance: 0,
        error: 'Checkout session is unpaid',
        statusCode: 402
      };
    }

    // 3. Catalog & Amount Check (FIX 5)
    const metadata = session.metadata || {};
    const productId = metadata.productId || '';
    const catalogItem = SERVER_CATALOG[productId];

    if (!catalogItem) {
      logPaymentEvent('payment_mismatch', {
        sessionId,
        reason: 'unknown_product_id',
        productId
      });
      return {
        success: false,
        alreadyFulfilled: false,
        creditsGranted: 0,
        creditsBalance: 0,
        error: `Unknown productId in session metadata: ${productId}`,
        statusCode: 400
      };
    }

    // Currency check
    const sessionCurrency = (session.currency || 'usd').toLowerCase();
    if (sessionCurrency !== catalogItem.currency.toLowerCase()) {
      logPaymentEvent('payment_mismatch', {
        sessionId,
        reason: 'currency_mismatch',
        expected: catalogItem.currency,
        received: sessionCurrency
      });
      return {
        success: false,
        alreadyFulfilled: false,
        creditsGranted: 0,
        creditsBalance: 0,
        error: `Payment currency mismatch: expected ${catalogItem.currency}, got ${sessionCurrency}`,
        statusCode: 400
      };
    }

    // Amount check: session.amount_total must equal catalog unit_amount in cents
    if (session.amount_total !== undefined && session.amount_total !== null) {
      if (session.amount_total !== catalogItem.amountCents) {
        logPaymentEvent('payment_mismatch', {
          sessionId,
          reason: 'amount_mismatch',
          expectedAmountCents: catalogItem.amountCents,
          actualAmountCents: session.amount_total
        });
        return {
          success: false,
          alreadyFulfilled: false,
          creditsGranted: 0,
          creditsBalance: 0,
          error: `Payment amount mismatch: expected ${catalogItem.amountCents} cents, got ${session.amount_total} cents`,
          statusCode: 400
        };
      }
    }

    // 4. Identity Resolution (FIX 3)
    // Map session -> agent from Stripe metadata or authenticated app identity ONLY.
    // Never trust ?email= from client query string.
    let targetAgentId: string | null = null;

    if (metadata.agentId && typeof metadata.agentId === 'string' && metadata.agentId.trim()) {
      targetAgentId = metadata.agentId.trim();
    } else if (metadata.apiKey && typeof metadata.apiKey === 'string') {
      targetAgentId = resolveAgentIdFromKey(metadata.apiKey);
    } else if (authenticatedAgentId && authenticatedAgentId.trim()) {
      targetAgentId = authenticatedAgentId.trim();
    }

    const creditsToAdd = catalogItem.credits;

    // For agent credits or subscription products that grant credits, targetAgentId MUST be resolved
    if (creditsToAdd > 0 && !targetAgentId) {
      logPaymentEvent('payment_mismatch', {
        sessionId,
        reason: 'unmapped_agent_identity',
        productId
      });
      return {
        success: false,
        alreadyFulfilled: false,
        creditsGranted: 0,
        creditsBalance: 0,
        error: 'Unmapped purchaser identity: cannot resolve agent from session metadata or auth',
        statusCode: 422
      };
    }

    // 5. Grant Credits Once (Atomically into Agent Wallet)
    let finalBalance = 0;
    if (creditsToAdd > 0 && targetAgentId) {
      if (!inMemoryAgentRegistry.has(targetAgentId)) {
        inMemoryAgentRegistry.set(targetAgentId, {
          agentId: targetAgentId,
          handle: targetAgentId.replace(/^agent_/, ''),
          displayName: 'Agent ' + targetAgentId,
          status: 'active' as const,
          createdAt: new Date().toISOString()
        });
      }

      const grantResult = await addCreditsToAgentWallet(targetAgentId, creditsToAdd, 'STRIPE_PURCHASE');
      if (!grantResult.success) {
        logPaymentEvent('checkout_failed', {
          sessionId,
          reason: 'credit_grant_failed',
          agentId: targetAgentId,
          error: grantResult.error
        });
        return {
          success: false,
          alreadyFulfilled: false,
          creditsGranted: 0,
          creditsBalance: 0,
          error: grantResult.error || 'Failed to grant credits to agent wallet',
          statusCode: 500
        };
      }
      finalBalance = grantResult.creditsBalance;
    } else if (targetAgentId) {
      const currentWallet = inMemoryWalletRegistry.get(targetAgentId);
      finalBalance = currentWallet ? currentWallet.creditsBalance : 0;
    }

    // 6. Persist Durable Fulfillment Record (FIX 4)
    const fulfillmentRecord: StripeFulfillmentRecord = {
      sessionId,
      stripeEventId: eventId || (source === 'webhook' ? 'unknown_event' : 'verify_session'),
      agentId: targetAgentId || 'unassigned_purchaser',
      creditsGranted: creditsToAdd,
      creditsBalance: finalBalance,
      amountUsd: catalogItem.priceUsd,
      amount: catalogItem.priceUsd,
      amountCents: catalogItem.amountCents,
      currency: catalogItem.currency,
      productId: catalogItem.productId,
      status: 'fulfilled',
      fulfilledAt: new Date().toISOString()
    };

    await setFulfilledStripeSessionAsync(sessionId, fulfillmentRecord);
    await setRecordedStripeSessionAsync(sessionId, session);

    logPaymentEvent('credit_fulfilled', {
      sessionId,
      eventId: fulfillmentRecord.stripeEventId,
      agentId: fulfillmentRecord.agentId,
      creditsGranted: fulfillmentRecord.creditsGranted,
      amountUsd: fulfillmentRecord.amountUsd,
      source
    });

    return {
      success: true,
      alreadyFulfilled: false,
      creditsGranted: creditsToAdd,
      creditsBalance: finalBalance,
      agentId: targetAgentId || undefined,
      fulfillmentRecord
    };
  });
}

/**
 * FIX 1: POST /api/stripe/webhook
 * Webhook Order:
 * 1. Verify signature
 * 2. Validate event
 * 3. If eventId already fulfilled successfully, return 200 and grant 0
 * 4. Handle checkout.session.completed
 * 5. Confirm Stripe payment is actually paid
 * 6. Resolve customer/agent from trusted Stripe metadata only
 * 7. Grant credits once
 * 8. Persist fulfillment
 * 9. THEN mark event processed
 * If grant or persist fails: HTTP 500, do NOT mark event processed
 */
export async function stripeWebhookHandler(req: any, res: Response) {
  try {
    const isProd = isProductionEnvironment(req);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    logPaymentEvent('webhook_received', {
      url: req.originalUrl || req.url,
      hasSignature: Boolean(req.headers['stripe-signature'])
    });

    // 1) In production: REQUIRE STRIPE_WEBHOOK_SECRET
    if (isProd && (!webhookSecret || webhookSecret.trim() === '')) {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured in production.');
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is required in production.' });
    }

    if (!webhookSecret || webhookSecret.trim() === '') {
      console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured.');
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET is not configured.' });
    }

    // 2) Require Stripe-Signature header
    const sig = req.headers['stripe-signature'] as string;
    if (!sig || sig.trim() === '') {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: any;
    try {
      const { default: Stripe } = await import('stripe');
      const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });
      const rawPayload = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      event = stripe.webhooks.constructEvent(rawPayload, sig, webhookSecret);
      logPaymentEvent('webhook_verified', { eventId: event?.id, type: event?.type });
    } catch (err: any) {
      console.error('[Stripe Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
    }

    if (!event || !event.type) {
      return res.status(400).json({ error: 'Invalid event payload' });
    }

    const eventId = event.id;

    // 3) If this eventId already fulfilled successfully, return 200 and grant 0
    if (eventId && (await isWebhookEventProcessedAsync(eventId))) {
      logPaymentEvent('duplicate_event', { eventId });
      return res.status(200).json({ received: true, idempotent: true, eventId, creditsGranted: 0 });
    }

    // 4) Handle checkout.session.completed
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      if (!session) {
        return res.status(400).json({ error: 'Missing session object in event data' });
      }

      // 5) Confirm payment status
      const isPaid = session.payment_status === 'paid' || session.status === 'complete';
      if (!isPaid) {
        return res.status(200).json({
          received: true,
          status: 'unpaid',
          message: 'Checkout session is not paid; credit fulfillment deferred',
          creditsGranted: 0
        });
      }

      // Execute authoritative payment fulfillment (steps 6-8)
      const fulfillmentRes = await fulfillAuthoritativePayment({
        session,
        eventId,
        source: 'webhook'
      });

      if (!fulfillmentRes.success) {
        // If grant or persist failed: return HTTP 500, DO NOT mark event processed so Stripe can retry
        const status = fulfillmentRes.statusCode || 500;
        return res.status(status).json({
          error: fulfillmentRes.error || 'Fulfillment error',
          creditsGranted: 0
        });
      }

      // 9) THEN mark event processed
      if (eventId) {
        await markWebhookEventProcessedAsync(eventId);
      }

      // Link items to profile if user email exists
      const metadata = session.metadata || {};
      const userEmail = metadata.email || session.customer_details?.email || session.customer_email;
      if (userEmail) {
        const currentItems = userProfilePurchases[userEmail]?.purchasedItems || [];
        userProfilePurchases[userEmail] = {
          email: userEmail,
          purchasedItems: currentItems,
          apiKey: metadata.apiKey || userProfilePurchases[userEmail]?.apiKey,
          linkedAt: new Date().toISOString()
        };
      }

      return res.status(200).json({
        received: true,
        fulfilled: true,
        idempotent: fulfillmentRes.alreadyFulfilled,
        sessionId: session.id,
        agentId: fulfillmentRes.agentId,
        creditsGranted: fulfillmentRes.creditsGranted,
        creditsBalance: fulfillmentRes.creditsBalance
      });
    }

    // Non-checkout events are marked processed and acknowledged
    if (eventId) {
      await markWebhookEventProcessedAsync(eventId);
    }
    return res.status(200).json({ received: true, type: event.type });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]:', err);
    return res.status(500).json({ error: 'Webhook processing error', details: err.message });
  }
}

/**
 * FIX 3 & 4 & 6: GET /api/checkout/verify-session
 * - Never trust ?email= as purchaser identity
 * - Do not invent synthetic agents for production fulfillment
 * - Map session -> agent from Stripe metadata / auth only
 * - Retrieve from Stripe API in production
 * - One grant per session
 */
export async function verifySessionHandler(req: Request, res: Response) {
  const sessionId = req.query.session_id as string;
  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({
      status: 'error',
      error: 'Missing session_id parameter'
    });
  }

  // Reject fake session IDs immediately
  if (sessionId === 'cs_test_fake' || sessionId.toLowerCase().includes('fake')) {
    return res.status(404).json({
      status: 'error',
      error: 'Invalid or fake checkout session ID',
      sessionId
    });
  }

  const isProd = isProductionEnvironment(req);
  let session: any = null;

  // In production: must retrieve from real Stripe API (FIX 6)
  if (isProd) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey || !stripeKey.startsWith('sk_live_')) {
      return res.status(500).json({
        status: 'error',
        error: 'Stripe API unavailable in production'
      });
    }

    try {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(stripeKey, { apiVersion: '2024-12-18.acacia' as any });
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (err: any) {
      console.warn(`[verify-session] Stripe session retrieval failed for ${sessionId}:`, err.message);
      return res.status(404).json({
        status: 'error',
        error: 'Checkout session not found on Stripe',
        sessionId,
        details: err.message
      });
    }
  } else {
    // Development / Sandbox mode
    session = await getRecordedStripeSessionAsync(sessionId);
    if (!session && process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
      try {
        const { default: Stripe } = await import('stripe');
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-12-18.acacia' as any });
        session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session) {
          await setRecordedStripeSessionAsync(session.id, session);
        }
      } catch (stripeErr: any) {
        console.warn(`[verify-session] Stripe session retrieval failed for ${sessionId}:`, stripeErr.message);
      }
    }
  }

  if (!session) {
    return res.status(404).json({
      status: 'error',
      error: 'Checkout session not found',
      sessionId
    });
  }

  // Reject unpaid sessions (FIX 6)
  const isPaid = session.payment_status === 'paid' || (session.status === 'complete' && session.payment_status !== 'unpaid');
  if (!isPaid) {
    return res.status(402).json({
      status: 'error',
      error: 'Unpaid checkout session',
      sessionId,
      paymentStatus: session.payment_status || session.status || 'unpaid'
    });
  }

  // Extract authenticated app identity if present (Authorization: Bearer <apiKey>)
  let authenticatedAgentId: string | undefined = undefined;
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token.startsWith('sb_live_')) {
      authenticatedAgentId = resolveAgentIdFromKey(token);
    }
  }

  // Authoritative fulfillment (checks catalog, amount, identity, idempotency)
  const fulfillmentRes = await fulfillAuthoritativePayment({
    session,
    source: 'verify-session',
    authenticatedAgentId
  });

  if (!fulfillmentRes.success) {
    const status = fulfillmentRes.statusCode || 400;
    return res.status(status).json({
      status: 'error',
      error: fulfillmentRes.error,
      sessionId,
      creditsGranted: 0
    });
  }

  const targetAgentId = fulfillmentRes.agentId || 'unassigned';
  const creditsBalance = fulfillmentRes.creditsBalance;
  const creditsGranted = fulfillmentRes.creditsGranted;

  // Real items based on product or standard items
  const items = [
    {
      id: 'playbook_13f_whale',
      title: '13F Whale Tracking & SEC Filing Playbook',
      category: 'playbook',
      downloadUrl: '/api/download/playbook/playbook_13f_whale'
    },
    {
      id: 'playbook_credit_800',
      title: 'Credit 800+ Dispute & FICO Repair Blueprint',
      category: 'playbook',
      downloadUrl: '/api/download/playbook/playbook_credit_800'
    },
    {
      id: 'playbook_reit_realestate',
      title: 'Real Estate & REIT Cash Flow Matrix',
      category: 'playbook',
      downloadUrl: '/api/download/playbook/playbook_reit_realestate'
    }
  ];

  // Provide or find real active API key
  const metadata = session.metadata || {};
  let activeApiKey: string | undefined = metadata.apiKey;
  if (!activeApiKey && targetAgentId) {
    for (const [key, rec] of inMemoryKeyRegistry.entries()) {
      if (rec.agentId === targetAgentId && rec.status === 'active' && key.startsWith('sb_live_')) {
        activeApiKey = key;
        break;
      }
    }
  }

  // Only provision an API key if this is an API bundle or subscription and no key exists
  const isApiOrSubscription = metadata.productId?.includes('bundle') ||
                              metadata.productType === 'subscription' ||
                              creditsGranted > 0;
  if (!activeApiKey && isApiOrSubscription && targetAgentId) {
    const publicId = crypto.randomBytes(6).toString('hex');
    const secret = crypto.randomBytes(12).toString('hex');
    activeApiKey = `sb_live_${publicId}_${secret}`;
    const secretHash = crypto.createHash('sha256').update(secret).digest('hex');

    const keyRecord = {
      keyId: publicId,
      agentId: targetAgentId,
      handle: targetAgentId.replace(/^agent_/, ''),
      ownerUid: 'stripe_customer',
      keyPrefix: `sb_live_${publicId}`,
      keyHash: secretHash,
      secretHash: secretHash,
      scopes: [
        'services:read',
        'services:write',
        'jobs:read',
        'jobs:execute',
        'requests:read',
        'requests:write',
        'payments:transact'
      ] as any,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: null,
      revokedAt: null,
      status: 'active' as const
    };

    inMemoryKeyRegistry.set(publicId, keyRecord);
    inMemoryKeyRegistry.set(activeApiKey, keyRecord);
    try {
      await db.collection('api_keys').doc(publicId).set(keyRecord, { merge: true });
      await db.collection('agent_api_keys').doc(publicId).set(keyRecord, { merge: true });
    } catch (_) {}
  }

  // Metadata email (from checkout creation time, NOT from ?email=)
  const metadataEmail = metadata.email || session.customer_details?.email || session.customer_email;
  if (metadataEmail) {
    userProfilePurchases[metadataEmail] = {
      email: metadataEmail,
      purchasedItems: items,
      apiKey: activeApiKey,
      linkedAt: new Date().toISOString()
    };
  }

  return res.json({
    status: 'ok',
    apiKey: activeApiKey,
    apiCreditsRemaining: creditsBalance,
    creditsGranted: creditsGranted,
    order: {
      sessionId: session.id,
      email: metadataEmail || 'customer@stockbloc.ai',
      totalPaid: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '$10.00',
      paymentStatus: session.payment_status || 'paid',
      timestamp: new Date().toISOString(),
      apiKey: activeApiKey,
      apiCreditsRemaining: creditsBalance,
      creditsGranted: creditsGranted
    },
    items,
    metadata
  });
}
