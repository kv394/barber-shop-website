import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
 try {
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const user = session?.user;

 if (!user) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Generate a secure secret
 const secret = authenticator.generateSecret();
 const otpauth = authenticator.keyuri(user.email || 'user', 'KutzApp', secret);

 // Generate QR code data URI
 const qrCodeDataUrl = await QRCode.toDataURL(otpauth);

 return NextResponse.json({
 secret,
 qrCodeDataUrl,
 otpauth
 });
 } catch (error: any) {
 console.error('Error generating TOTP setup:', error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
