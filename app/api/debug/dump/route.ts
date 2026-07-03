import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || 'Heritage';
  const shops = await prisma.shop.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    select: { id: true, name: true, template: true, customization: true }
  });
  return NextResponse.json(shops.map(s => ({
    id: s.id, name: s.name, template: s.template,
    customHtmlLen: (s.customization as any)?.customHtml?.length || 0
  })));
}
