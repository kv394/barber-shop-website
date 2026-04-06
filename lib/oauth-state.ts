/**
 * Secure OAuth state parameter utilities.
 *
 * The state token is an HMAC-signed, time-limited payload that prevents
 * CSRF, token-injection, and replay attacks during the OAuth callback.
 *
 * Format: base64url({ userId, nonce, exp }) + "." + hmac-sha256 signature
 */

import crypto from 'crypto';

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || '';
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

if (!STATE_SECRET) {
  console.warn('[SECURITY] OAUTH_STATE_SECRET is not set – OAuth state tokens will be weak');
}

interface StatePayload {
  /** Supabase user id */
  uid: string;
  /** Cryptographic nonce – prevents replay even within the TTL */
  nonce: string;
  /** Expiration timestamp (ms since epoch) */
  exp: number;
}

function hmac(data: string): string {
  return crypto.createHmac('sha256', STATE_SECRET).update(data).digest('base64url');
}

/**
 * Create a signed, time-limited state token for the OAuth flow.
 */
export function createOAuthState(userId: string): string {
  const payload: StatePayload = {
    uid: userId,
    nonce: crypto.randomBytes(16).toString('base64url'),
    exp: Date.now() + STATE_TTL_MS,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = hmac(encoded);
  return `${encoded}.${signature}`;
}

/**
 * Verify a signed state token. Returns the userId if valid, null otherwise.
 *
 * Checks:
 * 1. Structural validity (two parts separated by ".")
 * 2. HMAC signature (prevents tampering)
 * 3. Expiration (prevents replay after TTL)
 * 4. Payload shape
 */
export function verifyOAuthState(state: string): string | null {
  try {
    const dotIndex = state.indexOf('.');
    if (dotIndex === -1) return null;

    const encoded = state.slice(0, dotIndex);
    const signature = state.slice(dotIndex + 1);

    // Constant-time comparison to prevent timing attacks
    const expected = hmac(encoded);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }

    const raw: unknown = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf-8'),
    );

    // Runtime shape validation – the payload is untrusted input
    if (
      raw === null ||
      typeof raw !== 'object' ||
      !('uid' in raw) ||
      !('nonce' in raw) ||
      !('exp' in raw)
    ) {
      return null;
    }

    const payload = raw as Record<string, unknown>;

    // Check expiry
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) {
      return null;
    }

    // Validate shape
    if (typeof payload.uid !== 'string' || payload.uid.length === 0) {
      return null;
    }
    if (typeof payload.nonce !== 'string' || payload.nonce.length === 0) {
      return null;
    }

    return payload.uid;
  } catch {
    return null;
  }
}

