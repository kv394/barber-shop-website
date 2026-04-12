import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shopId: string; imageId: string }> }
) {
  try {
    const { shopId, imageId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    let userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF')) {
       return new Response("Forbidden", { status: 403 });
    }

    const image = await prisma.portfolioImage.findUnique({ where: { id: imageId } });
    if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    // STAFF can only delete their own images. SHOP_ADMINs can delete any in their shop.
    if (user.role === 'STAFF' && image.staffId !== user.id) {
       return new Response("Forbidden", { status: 403 });
    }

    if (user.role === 'SHOP_ADMIN' && image.shopId !== user.shopId) {
        return new Response("Forbidden", { status: 403 });
    }

    await prisma.portfolioImage.delete({
      where: { id: imageId }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    logger.error("Error deleting portfolio image:", error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
