import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { shopId, customHtml } = await request.json();
  
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  const custom = (shop?.customization as any) || {};
  custom.customHtml = customHtml;
  
  await prisma.shop.update({
    where: { id: shopId },
    data: { customization: custom }
  });
  
  return NextResponse.json({ success: true });
}
