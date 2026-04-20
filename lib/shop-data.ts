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
      const [user, allAccesses] = await Promise.all([
        prisma.user.findFirst({
          where: authUser?.email ? { email: authUser.email } : { id: userId },
          select: { id: true, role: true, shopId: true, name: true, email: true, canManageInventory: true, shopAccesses: shopId !== 'all' ? { where: { shopId } } : { select: { shopId: true, role: true } } },
        }),
        prisma.user.findFirst({
          where: authUser?.email ? { email: authUser.email } : { id: userId },
          select: {
            shop: { select: { id: true, name: true, companyName: true } },
            shopAccesses: { select: { shop: { select: { id: true, name: true, companyName: true } }, role: true } }
          }
        })
      ]);

      if (!user) return null;

      let effectiveRole = user.role;
      if (shopId !== 'all' && user.shopId !== shopId && user.shopAccesses && user.shopAccesses.length > 0) {
        effectiveRole = (user.shopAccesses[0] as any).role;
      } else if (shopId === 'all' && user.shopAccesses && user.shopAccesses.length > 0 && user.role !== 'SITE_ADMIN') {
        // Find highest role or just take the first access
        effectiveRole = user.role === 'SHOP_ADMIN' ? 'SHOP_ADMIN' : ((user.shopAccesses[0] as any).role || user.role);
      }

      const isSiteAdmin = effectiveRole === 'SITE_ADMIN';
      const isShopAdmin = effectiveRole === 'SHOP_ADMIN'; // Broadened for 'all'
      const isStaff = effectiveRole === 'STAFF';

      if (!isSiteAdmin && !isShopAdmin && !isStaff) return null;

      // Combine primary shop and accessed shops
      let accessibleShops: { id: string, name: string, companyName: string | null }[] = [];
      
      if (isSiteAdmin) {
        const allShops = await prisma.shop.findMany({ select: { id: true, name: true, companyName: true }, orderBy: { name: 'asc' } });
        accessibleShops = allShops;
      } else {
        const accessibleShopsMap = new Map<string, { id: string, name: string, companyName: string | null }>();
        if (allAccesses?.shop?.id) {
          accessibleShopsMap.set(allAccesses.shop.id, { id: allAccesses.shop.id, name: allAccesses.shop.name || '', companyName: allAccesses.shop.companyName });
        }
        if (Array.isArray(allAccesses?.shopAccesses)) {
          allAccesses.shopAccesses.forEach(access => {
            if (access?.shop?.id) {
              accessibleShopsMap.set(access.shop.id, { id: access.shop.id, name: access.shop.name || '', companyName: access.shop.companyName });
            }
          });
        }
        accessibleShops = Array.from(accessibleShopsMap.values());
      }

      let shop;
      if (shopId === 'all') {
        const firstShop = accessibleShops[0];
        if (!firstShop) return null;
        shop = {
          id: 'all',
          name: firstShop.companyName || 'All Locations',
          companyName: firstShop.companyName,
          template: 'modern',
          timezone: 'America/New_York',
          customization: {}
        };
      } else {
        shop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { id: true, name: true, companyName: true, customization: true, template: true, timezone: true },
        });
        if (!shop) return null;
      }

      const shopSlug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

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
