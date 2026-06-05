import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!dbUser || dbUser.role !== 'SITE_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { shopId } = await req.json();

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
