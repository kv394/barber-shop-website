import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { exchangeCodeForTokens } from '@/lib/google-calendar';
import { verifyOAuthState } from '@/lib/oauth-state';
import { logger } from '@/lib/logger';
import { createClient } from '@/utils/supabase/server';

// ---------------------------------------------------------------------------
// Hardened Google OAuth callback
// ---------------------------------------------------------------------------
// Security layers:
//  1. Clerk session authentication
//  2. HMAC-signed + time-limited state token (CSRF / replay prevention)
//  3. State-userId ↔ session-userId match (token-injection prevention)
//  4. Input sanitization (code format & length)
//  5. Google token response validation (shape + HTTP status)
//  6. User existence check before DB write
//  7. Fixed-origin redirects (open-redirect prevention)
//  8. Security event logging for monitoring / alerting
//  9. Generic error messages to the client (info-leak prevention)
// ---------------------------------------------------------------------------

/** Safe base URL for redirects – never trust the incoming request URL. */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function safeRedirect(path: string) {
  const base = getBaseUrl();
  // Ensure the path is relative and starts with /
  const safePath = path.startsWith('/') ? path : `/${path}`;
  return NextResponse.redirect(new URL(safePath, base));
}

const AUTH_CODE_MAX_LENGTH = 512;
const AUTH_CODE_PATTERN = /^[A-Za-z0-9/_\-]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const errorParam = searchParams.get('error'); // Google sends this on user-deny

  // --- 0. Google-side denial (user clicked "Cancel") ----------------------
  if (errorParam) {
    logger.info('Google OAuth denied by user', { error: errorParam });
    return safeRedirect('/my-appointments/profile?error=google_auth_denied');
  }

  // --- 1. Authenticate the session ----------------------------------------
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const sessionUserId = user?.id;
  if (!sessionUserId) {
    logger.warn('Google OAuth callback hit without authenticated session');
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }

  // --- 2. Validate presence of required parameters ------------------------
  if (!code || !state) {
    await logger.error('Google OAuth callback missing code or state', null, {
      userId: sessionUserId,
      path: '/api/integrations/google/callback',
    });
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }

  // --- 3. Sanitize the authorization code ---------------------------------
  if (code.length > AUTH_CODE_MAX_LENGTH || !AUTH_CODE_PATTERN.test(code)) {
    await logger.error('Google OAuth callback received malformed code', null, {
      userId: sessionUserId,
      path: '/api/integrations/google/callback',
    });
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }

  // --- 4. Verify the HMAC-signed, time-limited state token ----------------
  const stateUserId = verifyOAuthState(state);
  if (!stateUserId) {
    await logger.error(
      'Google OAuth state verification failed (tampered, expired, or replayed)',
      null,
      { userId: sessionUserId, path: '/api/integrations/google/callback' },
    );
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }

  // --- 5. Ensure the state userId matches the session userId --------------
  //     Prevents an attacker from initiating OAuth as user-A and completing
  //     the callback as user-B (token injection).
  if (stateUserId !== sessionUserId) {
    await logger.error(
      `Google OAuth userId mismatch: state=${stateUserId} session=${sessionUserId}`,
      null,
      { userId: sessionUserId, path: '/api/integrations/google/callback' },
    );
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }

  // --- 6. Exchange the code for tokens ------------------------------------
  try {
    const tokens = await exchangeCodeForTokens(code);

    if (tokens.refresh_token) {
      // 6a. Verify the user actually exists before writing
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: { id: true },
      });

      if (!user) {
        await logger.error(
          'Google OAuth callback for non-existent user',
          null,
          { userId: sessionUserId, path: '/api/integrations/google/callback' },
        );
        return safeRedirect('/my-appointments/profile?error=google_auth_failed');
      }

      // 6b. Persist the refresh token
      await prisma.user.update({
        where: { id: sessionUserId },
        data: { googleRefreshToken: tokens.refresh_token },
      });

      logger.info('Google Calendar connected successfully', { userId: sessionUserId });
    } else {
      // Google did not return a refresh token – this can happen if the user
      // had already granted consent previously. Log it but don't fail.
      logger.warn('Google OAuth returned no refresh_token', { userId: sessionUserId });
    }

    return safeRedirect('/my-appointments/profile?google=connected');
  } catch (err) {
    await logger.error('Google OAuth token exchange failed', err, {
      userId: sessionUserId,
      path: '/api/integrations/google/callback',
    });
    // Generic error – never leak internal details to the browser
    return safeRedirect('/my-appointments/profile?error=google_auth_failed');
  }
}
