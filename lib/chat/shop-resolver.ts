import { prisma } from '@/lib/prisma';
import type { ShopData } from './types';

/** Fields selected for every shop query */
const SHOP_SELECT = {
  id: true,
  name: true,
  timezone: true,
  customDomain: true,
  subdomain: true,
  customization: true,
  description: true,
  shopType: true,
  travelFee: true,
  baseLocation: true,
  slogan: true,
  googleMapsUrl: true,
  depositRequired: true,
  depositAmount: true,
  currency: true,
  paymentGateway: true,
  template: true,
} as const;

/**
 * Resolves a shop from the database using:
 * 1. Direct match by id, subdomain, or companyName
 * 2. Fuzzy fallback: search by first significant word, then slug-match
 *
 * Returns the shop data or null if not found.
 */
export async function resolveShop(shopId: string): Promise<ShopData | null> {
  let shop = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: shopId },
        { subdomain: shopId },
        { companyName: shopId },
      ],
    },
    select: SHOP_SELECT,
  });

  if (!shop) {
    const firstWord = shopId.split('-').find(w => w.length > 2) || shopId.split('-')[0];
    const candidates = await prisma.shop.findMany({
      where: { name: { contains: firstWord, mode: 'insensitive' } },
      take: 50,
      select: SHOP_SELECT,
    });
    shop = candidates.find(
      (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopId.toLowerCase()
    ) || null;
  }

  return shop as ShopData | null;
}
