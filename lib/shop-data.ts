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
      // Single combined query — replaces two separate findFirst calls
      const user = await prisma.user.findFirst({
        where: authUser?.email ? { email: authUser.email } : { id: userId },
        select: {
          id: true, role: true, shopId: true, name: true, email: true,
          canManageInventory: true, stripeConnectAccountId: true, stripeConnectOnboarded: true,
          shop: { select: { id: true, name: true, companyName: true } },
          shopAccesses: {
            select: {
              shopId: true, role: true,
              shop: { select: { id: true, name: true, companyName: true } },
            },
          },
        },
      });

      if (!user) return null;

      let effectiveRole = user.role;
      // ShopAccess can provide shop-specific role, but should not escalate
      // beyond User.role (which is the authoritative platform-level role set by site admin).
      const roleHierarchy: Record<string, number> = {
        'CLIENT': 0, 'ATTENDANCE_KIOSK': 1, 'BOOTH_RENTER': 2, 'STAFF': 3, 'SHOP_ADMIN': 4, 'SITE_ADMIN': 5
      };
      const userRoleLevel = roleHierarchy[user.role] ?? 0;

      if (shopId !== 'all' && user.shopId !== shopId && user.shopAccesses && user.shopAccesses.length > 0) {
        const accessRole = (user.shopAccesses[0] as any).role as string;
        const accessRoleLevel = roleHierarchy[accessRole] ?? 0;
        // Only use ShopAccess role if it doesn't exceed the user's platform role
        effectiveRole = (accessRoleLevel <= userRoleLevel ? accessRole : user.role) as typeof user.role;
      } else if (shopId === 'all' && user.shopAccesses && user.shopAccesses.length > 0 && user.role !== 'SITE_ADMIN') {
        const accessRole = ((user.shopAccesses[0] as any).role || user.role) as string;
        const accessRoleLevel = roleHierarchy[accessRole] ?? 0;
        effectiveRole = (accessRoleLevel <= userRoleLevel ? accessRole : user.role) as typeof user.role;
      }

      const isSiteAdmin = effectiveRole === 'SITE_ADMIN';
      const isShopAdmin = effectiveRole === 'SHOP_ADMIN'; // Broadened for 'all'
      const isStaff = effectiveRole === 'STAFF' || effectiveRole === 'BOOTH_RENTER';

      if (!isSiteAdmin && !isShopAdmin && !isStaff) return null;

      // SITE_ADMIN must have support access to view shop pages
      if (isSiteAdmin && shopId !== 'all') {
        const targetShop = await prisma.shop.findUnique({
          where: { id: shopId },
          select: { supportAccessEnabled: true, supportAccessExpiresAt: true },
        });
        const isExpired = targetShop?.supportAccessExpiresAt
          ? new Date(targetShop.supportAccessExpiresAt) < new Date()
          : false;
        if (!targetShop?.supportAccessEnabled || isExpired) {
          return null; // Will trigger redirect in layout
        }
      }

      // Combine primary shop and accessed shops
      let accessibleShops: { id: string, name: string, companyName: string | null }[] = [];
      
      if (isSiteAdmin) {
        const allShops = await prisma.shop.findMany({ select: { id: true, name: true, companyName: true }, orderBy: { name: 'asc' } });
        accessibleShops = allShops;
      } else {
        const accessibleShopsMap = new Map<string, { id: string, name: string, companyName: string | null }>();
        if ((user as any).shop?.id) {
          const s = (user as any).shop;
          accessibleShopsMap.set(s.id, { id: s.id, name: s.name || '', companyName: s.companyName });
        }
        if (Array.isArray(user.shopAccesses)) {
          user.shopAccesses.forEach((access: any) => {
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
          select: { id: true, name: true, companyName: true, description: true, slogan: true, customization: true, template: true, timezone: true, shopType: true, subdomain: true, customDomain: true },
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
