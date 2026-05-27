import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Redirects the renter to Stripe's OAuth authorization page
export async function GET(request: Request) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (!dbUser || dbUser.role !== 'BOOTH_RENTER') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const clientId = process.env.STRIPE_CLIENT_ID;
 const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

 if (!clientId) {
 return NextResponse.json({ error: 'Stripe Connect not configured' }, { status: 500 });
 }

 // HMAC-sign the user ID to prevent state forgery in OAuth flow
 const hmac = crypto.createHmac('sha256', process.env.OAUTH_STATE_SECRET || 'fallback-secret').update(dbUser.id).digest('hex');
 const stateToken = `${hmac}:${dbUser.id}`;

 const params = new URLSearchParams({
 response_type: 'code',
 client_id: clientId,
 scope: 'read_write',
 redirect_uri: `${appUrl}/api/stripe/connect/callback`,
 state: stateToken,
 'stripe_user[email]': dbUser.email,
 ...(dbUser.name ? { 'stripe_user[first_name]': dbUser.name.split(' ')[0] } : {}),
 });

 return NextResponse.redirect(
 `https://connect.stripe.com/oauth/authorize?${params.toString()}`
 );
}
