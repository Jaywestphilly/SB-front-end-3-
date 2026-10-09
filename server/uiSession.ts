import type { Request, Response } from 'express';
import crypto from 'crypto';
import rateLimit, { MemoryStore } from 'express-rate-limit';

// Boot secret generated once if SB_UI_COOKIE_SECRET is not set
const bootSecret = crypto.randomBytes(32);

function getSecret(): Buffer | string {
  const envSecret = process.env.SB_UI_COOKIE_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    return envSecret.trim();
  }
  return bootSecret;
}

/**
 * Issue a signed HttpOnly UI session cookie for SPA browser navigations.
 * Uses format: "<expiresMs>.<nonce>.<hmacSha256(secret, expiresMs + '.' + nonce) base64url>"
 */
export function issueUiCookie(res: Response): string {
  const expiresMs = Date.now() + 1800 * 1000;
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${expiresMs}.${nonce}`;
  const hmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');
  const cookieValue = `${payload}.${hmac}`;

  const isTest = process.env.NODE_ENV === 'test';
  let isLocalhostHttp = false;
  const req = (res as any).req as Request | undefined;
  if (req) {
    const host = (req.get ? req.get('host') : (req.headers && req.headers.host)) || '';
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1') || host.includes('localhost:') || host.includes('127.0.0.1:');
    const isHttp = (req.protocol === 'http') || !(req.secure || (req.headers && req.headers['x-forwarded-proto'] === 'https'));
    if (isLocalhost && isHttp) {
      isLocalhostHttp = true;
    }
  }

  const secure = !isTest && !isLocalhostHttp;

  if (typeof res.cookie === 'function') {
    res.cookie('sb_ui', cookieValue, {
      httpOnly: true,
      secure,
      sameSite: 'strict',
      path: '/api',
      maxAge: 1800 * 1000,
    });
  } else if (typeof res.setHeader === 'function') {
    const parts = [
      `sb_ui=${cookieValue}`,
      'Max-Age=1800',
      'Path=/api',
      'HttpOnly',
      'SameSite=Strict'
    ];
    if (secure) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
  }

  return cookieValue;
}

/**
 * Hand-parsed cookie verification. Recomputes HMAC and constant-time compares.
 * Rejects expired, malformed, or tampered cookies.
 */
export function verifyUiCookie(req: Request): boolean {
  try {
    const rawCookieHeader = (req.headers && (req.headers.cookie || req.headers.Cookie)) as string | undefined;
    if (!rawCookieHeader || typeof rawCookieHeader !== 'string') {
      return false;
    }

    let cookieVal: string | null = null;
    const parts = rawCookieHeader.split(';');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.startsWith('sb_ui=')) {
        cookieVal = trimmed.slice('sb_ui='.length);
        break;
      }
    }

    if (!cookieVal) {
      return false;
    }

    if (cookieVal.includes('%')) {
      try {
        cookieVal = decodeURIComponent(cookieVal);
      } catch {
        // Ignore URI decode errors
      }
    }

    const segments = cookieVal.split('.');
    if (segments.length !== 3) {
      return false;
    }

    const [expiresMsStr, nonce, receivedHmac] = segments;
    if (!expiresMsStr || !nonce || !receivedHmac) {
      return false;
    }

    const expiresMs = Number(expiresMsStr);
    if (!Number.isFinite(expiresMs)) {
      return false;
    }

    if (Date.now() > expiresMs) {
      return false;
    }

    const payload = `${expiresMsStr}.${nonce}`;
    const expectedHmac = crypto.createHmac('sha256', getSecret()).update(payload).digest('base64url');

    const receivedBuf = Buffer.from(receivedHmac, 'utf8');
    const expectedBuf = Buffer.from(expectedHmac, 'utf8');

    if (receivedBuf.length !== expectedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(receivedBuf, expectedBuf);
  } catch {
    return false;
  }
}

// Memory store for per-IP UI bypass rate limiting (120 requests/min)
const uiBypassStore = new MemoryStore();

export const uiBypassLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  store: uiBypassStore,
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, _res, next) => {
    (req as any)._uiBypassRateLimited = true;
    next();
  },
  validate: { xForwardedForHeader: false, default: false }
});

export function uiBypassAllowed(req: Request): boolean {
  try {
    if ((req as any)._uiBypassRateLimited) {
      return false;
    }
    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const client = (uiBypassStore as any).getClient(ip);
    if (client.resetTime.getTime() <= now) {
      (uiBypassStore as any).resetClient(client, now);
    }
    if (client.totalHits >= 120) {
      return false;
    }
    client.totalHits++;
    return true;
  } catch {
    return true;
  }
}

export function resetUiBypassLimiter(): void {
  try {
    (uiBypassStore as any).resetAll?.();
  } catch {
    // ignore
  }
}
