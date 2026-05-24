import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import stripe from '@/lib/stripe';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// Stripe redirects here after the renter completes OAuth onboarding
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const userId = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error || !code || !userId) {
    logger.warn('Stripe Connect OAuth cancelled or failed', { error, userId });
    return NextResponse.redirect(`${appUrl}?stripe_connect=cancelled`);
  }

  try {
    // Exchange the auth code for a connected account ID
    const response = await stripe.oauth.token({
      grant_type: 'authorization_code',
      code,
    });

    const stripeConnectAccountId = response.stripe_user_id;
    if (!stripeConnectAccountId) throw new Error('No stripe_user_id in response');

    // Find the renter by our internal ID (passed as state)
    const dbUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!dbUser || dbUser.role !== 'BOOTH_RENTER') {
      logger.warn('Stripe Connect callback: user not found or not a booth renter', { userId });
      return NextResponse.redirect(`${appUrl}?stripe_connect=error`);
    }

    // Save the connected account ID
    await prisma.user.update({
      where: { id: userId },
      data: {
        stripeConnectAccountId,
        stripeConnectOnboarded: true,
      },
    });

    logger.info(`Stripe Connect linked for booth renter ${userId}: ${stripeConnectAccountId}`);

    // Redirect back to their profile/setup page with success flag
    // Find which shop they belong to for the redirect
    const shopId = dbUser.shopId;
    const redirectPath = shopId
      ? `/shop/${shopId}/my-booking-link?stripe_connect=success`
      : `/?stripe_connect=success`;

    return NextResponse.redirect(`${appUrl}${redirectPath}`);
  } catch (err: any) {
    logger.error('Stripe Connect callback error:', err);
    return NextResponse.redirect(`${appUrl}?stripe_connect=error`);
  }
}
