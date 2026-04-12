import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import ClientHomePage from './page.client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
      select: { role: true, shopId: true, shop: { select: { name: true } } }
    });

    if (dbUser) {
      if (dbUser.role === 'CLIENT') {
        const targetSlug = dbUser.shop?.name ? dbUser.shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') : null;
        if (targetSlug) {
          redirect(`/shops/${targetSlug}`);
        } else {
          redirect('/shops');
        }
      } else if (dbUser.role === 'SHOP_ADMIN' || dbUser.role === 'STAFF') {
        if (dbUser.shopId) {
          redirect(`/shop/${dbUser.shopId}`);
        }
      }
      // If SITE_ADMIN or KIOSK, we stay here to let them see the platform dashboard / kiosk interface
    }
  }

  return <ClientHomePage />;
}
