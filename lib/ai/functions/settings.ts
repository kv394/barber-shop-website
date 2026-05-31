import { getTenantClient } from '@/lib/prisma';

/** Update shop settings */
export async function updateShopSettings(args: { settings: Record<string, any> }, shopId: string) {
  const db = await getTenantClient(shopId);
  const updated = await db.shop.update({
    where: { id: shopId },
    data: { customization: args.settings },
  });
  return updated;
}

/** Get shop settings */
export async function getShopSettings(_args: {}, shopId: string) {
  const db = await getTenantClient(shopId);
  const shop = await db.shop.findUnique({
    where: { id: shopId },
    select: { customization: true },
  });
  return shop?.customization ?? {};
}
