/**
 * Google Calendar sync service (C4).
 *
 * Requires env vars:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REDIRECT_URI (e.g. https://yourapp.com/api/integrations/google/callback)
 *
 * Each user stores their refresh token in User.googleRefreshToken.
 */

import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createOAuthState } from '@/lib/oauth-state';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';

/**
 * Generate the OAuth2 authorization URL for Google Calendar.
 * Uses an HMAC-signed, time-limited state token to prevent CSRF & replay attacks.
 */
export function getGoogleAuthUrl(userId: string): string {
  const state = createOAuthState(userId);
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchange an authorization code for tokens.
 * Validates the HTTP response and the payload shape before returning.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
      code,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text().catch(() => 'unknown');
    throw new Error(`Google token exchange failed (${res.status}): ${errorBody}`);
  }

  const data = await res.json();

  // Validate expected shape – prevents trusting garbage data
  if (typeof data.access_token !== 'string' || typeof data.token_type !== 'string') {
    throw new Error('Google token response missing required fields');
  }

  return data as GoogleTokenResponse;
}

/**
 * Get a fresh access token from a refresh token.
 */
async function getAccessToken(refreshToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.access_token !== 'string') return null;
    return data.access_token;
  } catch {
    return null;
  }
}

/** Validate Google Calendar event ID format – prevents path-traversal injection. */
const CALENDAR_EVENT_ID_PATTERN = /^[a-zA-Z0-9_-]{1,1024}$/;

/**
 * Create a Google Calendar event for an appointment.
 */
export async function createCalendarEvent(
  userId: string,
  appointment: {
    startTime: Date;
    endTime: Date;
    serviceName: string;
    staffName: string;
    shopName: string;
  },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true, email: true },
  });
  if (!user?.googleRefreshToken) return null;

  const accessToken = await getAccessToken(user.googleRefreshToken);
  if (!accessToken) return null;

  try {
    const event = {
      summary: `${appointment.serviceName} at ${appointment.shopName}`,
      description: `Appointment with ${appointment.staffName}`,
      start: { dateTime: appointment.startTime.toISOString() },
      end: { dateTime: appointment.endTime.toISOString() },
      reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 60 }] },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (res.ok) {
      const data = await res.json();
      // Validate the returned event ID before returning it
      if (typeof data.id === 'string' && CALENDAR_EVENT_ID_PATTERN.test(data.id)) {
        return data.id;
      }
    }
    return null;
  } catch (error) {
    logger.error('Failed to create Google Calendar event:', error);
    return null;
  }
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
  // Sanitize eventId to prevent path traversal
  if (!eventId || !CALENDAR_EVENT_ID_PATTERN.test(eventId)) {
    logger.warn('deleteCalendarEvent called with invalid eventId', { userId, eventId });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true },
  });
  if (!user?.googleRefreshToken) return;

  const accessToken = await getAccessToken(user.googleRefreshToken);
  if (!accessToken) return;

  try {
    await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
  } catch (error) {
    logger.error('Failed to delete Google Calendar event:', error);
  }
}

