import { NextRequest, NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ shopId: string, id: string }> }) {
  const { shopId, id } = await params;
  const auth = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(auth)) return auth;

  try {
    const template = await prisma.dynamicTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only allow deletion if it belongs to this shop (or if user is SUPER_ADMIN)
    if (template.shopId !== shopId && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You can only delete templates created by your shop.' }, { status: 403 });
    }

    await prisma.dynamicTemplate.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ shopId: string, id: string }> }) {
  const { shopId, id } = await params;
  const auth = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(auth)) return auth;

  const body = await request.json();

  try {
    const template = await prisma.dynamicTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Only allow updating if it belongs to this shop (or if user is SUPER_ADMIN)
    if (template.shopId !== shopId && auth.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'You can only edit templates created by your shop.' }, { status: 403 });
    }

    const updated = await prisma.dynamicTemplate.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        htmlCode: body.htmlCode,
        cssCode: body.cssCode,
      },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
