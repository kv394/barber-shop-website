import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string; addonId: string }> }
) {
 try {
 const { shopId, addonId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Verify ownership
 const addon = await prisma.serviceAddon.findUnique({
 where: { id: addonId },
 select: { shopId: true }
 });

 if (!addon || addon.shopId !== shopId) {
 return NextResponse.json({ error: 'Not found' }, { status: 404 });
 }

 await prisma.serviceAddon.delete({
 where: { id: addonId }
 });

 return NextResponse.json({ success: true });
 } catch (error) {
 console.error('Error deleting addon:', error);
 return NextResponse.json({ error: 'Failed to delete addon' }, { status: 500 });
 }
}
