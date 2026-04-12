import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { AVAILABLE_TEMPLATES } from '@/lib/templates';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is admin for this shop or a SITE_ADMIN
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || user.shopId !== shopId))) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to update this shop' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { template } = body;

    if (!template || typeof template !== 'string') {
      return NextResponse.json(
        { error: 'Template is required' },
        { status: 400 }
      );
    }

    // SECURITY: Only allow known template values
    const allowedTemplates = Object.keys(AVAILABLE_TEMPLATES);
    let isValid = allowedTemplates.includes(template);

    if (!isValid) {
      console.log('Searching for dynamic template:', template);
      const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
        where: { name: template }
      });
      console.log('Found dynamic template:', dynamicTemplate?.name);
      if (dynamicTemplate) {
        isValid = true;
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid template name' },
        { status: 400 }
      );
    }

    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: {
        template,
      },
    });
    
    // Clear the cache so the new template is applied everywhere
    revalidatePath(`/shop/${shopId}`);
    revalidatePath(`/shop/${shopId}/config`);
    revalidatePath('/shops/[slug]', 'page'); // Bust public shop page cache

    return NextResponse.json(updatedShop, { status: 200 });
  } catch (error: any) {
    logger.error('Error updating template:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    );
  }
}
