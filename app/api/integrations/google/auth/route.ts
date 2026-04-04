import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getGoogleAuthUrl } from '@/lib/google-calendar';
import { logger } from '@/lib/logger';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify required env vars are configured
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    await logger.error('Google OAuth env vars not configured', null, {
      userId,
      path: '/api/integrations/google/auth',
    });
    return NextResponse.json(
      { error: 'Google integration is not configured' },
      { status: 503 },
    );
  }

  const url = getGoogleAuthUrl(userId);

  // Validate the generated URL points to Google before redirecting
  const parsed = new URL(url);
  if (parsed.hostname !== 'accounts.google.com') {
    await logger.error('Generated Google auth URL has unexpected hostname', null, {
      userId,
      path: '/api/integrations/google/auth',
    });
    return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
  }

  logger.info('Google OAuth flow initiated', { userId });
  return NextResponse.redirect(url);
}
