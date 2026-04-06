import { cache } from 'react';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/cache';
import { createClient } from '@/utils/supabase/server';

/**
 * Cached per-request: fetches the current user + role.
 * React `cache()` ensures this only hits the DB once per server request,
 * even if called from both layout.tsx and page.tsx.
 */
export const getShopLayoutData = cache(async (userId: string, shopId: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const authUser = user;
  const cacheKey = `shop_layout:${authUser?.email || userId}:${shopId}`;

  // Use Redis cache layered inside the per-request React memory cache
  return cacheService.getOrSet(
    cacheKey,
    async () => {
      const [user, shop] = await Promise.all([
        prisma.user.findFirst({
          where: authUser?.email ? { email: authUser.email } : { id: userId },
          select: { id: true, role: true, shopId: true, name: true, email: true, canManageInventory: true },
        }),
        prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true, name: true, customization: true, template: true, timezone: true },
        }),
      ]);

      if (!user || !shop) return null;

      const isSuperAdmin = user.role === 'SUPER_ADMIN';
      const isShopAdmin = user.role === 'SHOP_ADMIN' && user.shopId === shopId;
      const isStaff = user.role === 'STAFF' && user.shopId === shopId;

      if (!isSuperAdmin && !isShopAdmin && !isStaff) return null;

      const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      return {
        user,
        shop: JSON.parse(JSON.stringify(shop)),
        shopSlug,
        userRole: user.role as string,
        isSuperAdmin,
        isShopAdmin,
        isStaff,
        canManageInventory: user.canManageInventory,
      };
    },
    // Cache for 10 minutes
    600
  );
});
