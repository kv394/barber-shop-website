import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const adminCheck = await requireSiteAdmin();
    if (adminCheck instanceof NextResponse) return adminCheck;

    const { shopId } = await req.json();

    const cookieStore = await cookies();

    if (shopId) {
      // Check if shop exists and has granted support access
      const shop = await prisma.shop.findUnique({ where: { id: shopId } });
      if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
      
      if (!shop.supportAccessEnabled) {
        return NextResponse.json({ error: 'Support access not granted by shop owner.' }, { status: 403 });
      }

      if (shop.supportAccessExpiresAt && shop.supportAccessExpiresAt < new Date()) {
        return NextResponse.json({ error: 'Support access has expired.' }, { status: 403 });
      }

      cookieStore.set('kutz_impersonate_shop', shopId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
    } else {
      // Clear impersonation
      cookieStore.delete('kutz_impersonate_shop');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Impersonate error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
