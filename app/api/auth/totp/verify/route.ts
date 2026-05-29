import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { authenticator } from '@otplib/preset-default';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const { secret, token } = await req.json();

 if (!secret || !token) {
 return NextResponse.json({ error: 'Missing secret or token' }, { status: 400 });
 }

 // Verify the code against the secret
 const isValid = authenticator.verify({ token, secret });

 if (!isValid) {
 return NextResponse.json({ error: 'Invalid authenticator code' }, { status: 400 });
 }

  // Save the secret securely in the database
  const { encrypt } = await import('@/lib/encryption');
  await prisma.user.update({
    where: { id: user.id },
    data: { recoveryTotpSecret: encrypt(secret) }
  });

 return NextResponse.json({ success: true, message: 'Authenticator app linked successfully.' });
 } catch (error: any) {
 console.error('Error verifying TOTP setup:', error);
 return NextResponse.json({ error: 'Failed to verify authenticator setup' }, { status: 500 });
 }
}
