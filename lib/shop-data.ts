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
      const [user, shop, allAccesses] = await Promise.all([
        prisma.user.findFirst({
          where: authUser?.email ? { email: authUser.email } : { id: userId },
          select: { id: true, role: true, shopId: true, name: true, email: true, canManageInventory: true, shopAccesses: { where: { shopId } } },
        }),
        prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true, name: true, customization: true, template: true, timezone: true },
        }),
        prisma.user.findFirst({
          where: authUser?.email ? { email: authUser.email } : { id: userId },
          select: {
            shop: { select: { id: true, name: true } },
            shopAccesses: { select: { shop: { select: { id: true, name: true } }, role: true } }
          }
        })
      ]);

      if (!user || !shop) return null;

      let effectiveRole = user.role;
      if (user.shopId !== shopId && user.shopAccesses && user.shopAccesses.length > 0) {
        effectiveRole = user.shopAccesses[0].role;
      }

      const isSiteAdmin = effectiveRole === 'SITE_ADMIN';
      const isShopAdmin = effectiveRole === 'SHOP_ADMIN' && (user.shopId === shopId || (user.shopAccesses && user.shopAccesses.length > 0));
      const isStaff = effectiveRole === 'STAFF' && (user.shopId === shopId || (user.shopAccesses && user.shopAccesses.length > 0));

      if (!isSiteAdmin && !isShopAdmin && !isStaff) return null;

      const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      // Combine primary shop and accessed shops
      let accessibleShops: { id: string, name: string }[] = [];
      
      if (isSiteAdmin) {
        const allShops = await prisma.shop.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
        accessibleShops = allShops;
      } else {
        const accessibleShopsMap = new Map<string, { id: string, name: string }>();
        if (allAccesses?.shop?.id) {
          accessibleShopsMap.set(allAccesses.shop.id, { id: allAccesses.shop.id, name: allAccesses.shop.name || '' });
        }
        if (Array.isArray(allAccesses?.shopAccesses)) {
          allAccesses.shopAccesses.forEach(access => {
            if (access?.shop?.id) {
              accessibleShopsMap.set(access.shop.id, { id: access.shop.id, name: access.shop.name || '' });
            }
          });
        }
        accessibleShops = Array.from(accessibleShopsMap.values());
      }

      return {
        user: { ...user, role: effectiveRole },
        shop: JSON.parse(JSON.stringify(shop)),
        shopSlug,
        userRole: effectiveRole as string,
        isSiteAdmin,
        isShopAdmin,
        isStaff,
        canManageInventory: user.canManageInventory,
        accessibleShops,
      };
    },
    // Cache for 10 minutes
    600
  );
});
