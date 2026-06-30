import { Role } from '@/lib/auth/role';
import slugify from '@/lib/utils/slugify';
import { redirect } from 'next/navigation';
import type { PrismaClient } from '@prisma/client';

/**
 * Handles role‑based redirects for the authenticated user.
 * Returns `true` if a redirect was performed (so the caller can stop further rendering).
 */
export async function resolveRedirect(
  userEmail: string | null,
  prisma: PrismaClient
): Promise<boolean> {
  if (!userEmail) return false;

  const dbUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      role: true,
      shopId: true,
      shop: { select: { name: true } },
      shopAccesses: { select: { shopId: true, shop: { select: { name: true } } } },
    },
  });

  if (!dbUser) return false;

  switch (dbUser.role as Role) {
    case Role.CLIENT: {
      const slug = dbUser.shop?.name ? slugify(dbUser.shop.name) : null;
      if (slug) {
        redirect(`/shops/${slug}`);
        return true;
      }
      // fall through to client home page (Account Not Configured)
      break;
    }
    case Role.SITE_ADMIN: {
      redirect('/siteadmin');
      return true;
    }
    case Role.SHOP_ADMIN:
    case Role.STAFF:
    case Role.BOOTH_RENTER: {
      if (dbUser.shopId) {
        redirect(`/shop/${dbUser.shopId}`);
        return true;
      }
      if (dbUser.shopAccesses && dbUser.shopAccesses.length > 0) {
        redirect(`/shop/${dbUser.shopAccesses[0].shopId}`);
        return true;
      }
      break;
    }
    // ATTENDANCE_KIOSK and any other roles stay on the dashboard page
    default:
      break;
  }
  return false;
}
