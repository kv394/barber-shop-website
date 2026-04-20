import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ shopId: string, productId: string }> }
) {
  try {
    const { shopId, productId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    const userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    
    const isSiteAdmin = user?.role === 'SITE_ADMIN';
    const isShopAdmin = user?.role === 'SHOP_ADMIN' && user?.shopId === shopId;
    const isStaff = user?.role === 'STAFF' && user?.shopId === shopId;

    if (!isSiteAdmin && !isShopAdmin && !isStaff) {
       return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { barcode } = body;

    if (!barcode) {
        return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
        where: { id: productId }
    });

    if(!product || (product.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: product.id, shopId } })))) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if barcode is already used by another product
    const existing = await prisma.product.findFirst({
        where: { shopId, barcode }
    });

    if (existing && existing.id !== productId) {
        return NextResponse.json({ error: 'Barcode already in use by another product' }, { status: 400 });
    }

    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: { barcode }
    });

    revalidatePath(`/shop/${shopId}/config/products`);

    return NextResponse.json(updatedProduct, { status: 200 });
  } catch (error: any) {
    logger.error("Error updating barcode:", error);
    return NextResponse.json({ error: 'Failed to update barcode' }, { status: 500 });
  }
}
