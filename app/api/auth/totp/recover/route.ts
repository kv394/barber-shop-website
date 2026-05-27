import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // We need the admin client
import { authenticator } from '@otplib/preset-default';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
 try {
 const { email, token, newPassword } = await req.json();

 // Rate limit TOTP recovery attempts per email (5 per 15 minutes, fail closed)
 if (email) {
 const rateLimitResult = await rateLimit('totp-recover:' + email.toLowerCase(), 5, 15 * 60, true);
 if (!rateLimitResult.success) {
 return NextResponse.json({ error: 'Too many recovery attempts. Please try again later.' }, { status: 429 });
 }
 }

 if (!email || !token || !newPassword) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 if (newPassword.length < 8) {
 return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
 }

 // 1. Look up the user by email to get their secret
 const userRecord = await prisma.user.findUnique({
 where: { email: email.toLowerCase() },
 select: { id: true, recoveryTotpSecret: true }
 });

 if (!userRecord || !userRecord.recoveryTotpSecret) {
 // Return a generic error to prevent email enumeration, but clearly indicate failure
 return NextResponse.json({ error: 'Invalid email or Authenticator not configured for this account.' }, { status: 400 });
 }

 // 2. Validate the 6-digit code
 const isValid = authenticator.verify({ token, secret: userRecord.recoveryTotpSecret });

 if (!isValid) {
 return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 400 });
 }

 // 3. Initialize Supabase Admin Client to bypass authentication and forcefully update the password
 const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

 if (!supabaseUrl || !supabaseServiceKey) {
 console.error('Missing SUPABASE_SERVICE_ROLE_KEY for TOTP recovery');
 return NextResponse.json({ error: 'Server configuration error. Contact administrator.' }, { status: 500 });
 }

 const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
 auth: {
 autoRefreshToken: false,
 persistSession: false
 }
 });

 // 4. Forcefully update the user's password using the Admin API
 const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
 userRecord.id,
 { password: newPassword }
 );

 if (updateError) {
 console.error('Error updating user password via Admin API:', updateError);
 return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
 }

 return NextResponse.json({ success: true, message: 'Password recovered successfully. You can now log in.' });

 } catch (error: any) {
 console.error('Error in TOTP recovery:', error);
 return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
 }
}
