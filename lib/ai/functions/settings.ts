import { getTenantClient } from '@/lib/prisma';

/** Update shop settings */
export async function updateShopSettings(args: { settings: Record<string, any> }, shopId: string) {
  const db = getTenantClient(shopId);
  const updated = await db.shop.update({
    where: { id: shopId },
    data: args.settings,
  });
  return updated;
}

/** Get shop settings */
export async function getShopSettings(_args: {}, shopId: string) {
  const db = getTenantClient(shopId);
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { settings: true },
  });
  return shop?.settings ?? {};
}
