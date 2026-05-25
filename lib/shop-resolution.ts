import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function resolveShopId(paramShopId: string): Promise<string | null> {
  // If it's already a valid CUID/UUID format, we could optimize, but Prisma handles it.
  const resolvedShop = await prisma.shop.findFirst({
    where: {
      OR: [
        { id: paramShopId },
        { subdomain: paramShopId },
        { customDomain: paramShopId },
        { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
      ]
    },
    select: { id: true }
  });

  return resolvedShop?.id || null;
}
