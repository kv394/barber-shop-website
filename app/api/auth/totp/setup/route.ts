import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate a secure secret
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(user.email || 'user', 'Barbersaas', secret);

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
