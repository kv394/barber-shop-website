import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { AVAILABLE_TEMPLATES } from '@/lib/templates';
import { cacheService } from '@/lib/cache';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;

 if (!userId) {
 return NextResponse.json(
 { error: 'Unauthorized' },
 { status: 401 }
 );
 }

 // Verify user is admin for this shop or a SITE_ADMIN
 const user = await tenantClient.user.findFirst({
 where: { OR: [{ id: userId }, { email: authUserEmail || '' }] },
 });

 if (!user || ((user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return NextResponse.json(
 { error: 'Forbidden: You do not have permission to update this shop' },
 { status: 403 }
 );
 }

 const body = await request.json();
 const { template, customHtml, authPosition, chatbotPosition } = body;

 if (!template || typeof template !== 'string') {
 return NextResponse.json(
 { error: 'Template is required' },
 { status: 400 }
 );
 }

 // SECURITY: Only allow known template values
 const allowedTemplates = Object.keys(AVAILABLE_TEMPLATES);
 let isValid = allowedTemplates.includes(template) || template === 'custom';

 if (!isValid) {
 const dynamicTemplate = await tenantClient.dynamicTemplate.findUnique({
 where: { name: template }
 });
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

 let updateData: any = { template };
 
 if (template === 'custom') {
 const shop = await tenantClient.shop.findUnique({ where: { id: shopId } });
 const currentCustomization = (shop?.customization as any) || {};
 updateData.customization = { 
 ...currentCustomization, 
 customHtml: customHtml || '',
 authPosition: authPosition || 'top-right',
 chatbotPosition: chatbotPosition || 'bottom-right'
 };
 }

 const updatedShop = await tenantClient.shop.update({
 where: { id: shopId },
 data: updateData,
 });
 
  // Clear the cache so the new template is applied everywhere
  // page.tsx caches by slug (name-based), so invalidate both the ID-based
  // and slug-based cache keys to prevent stale data.
  await cacheService.invalidate(`shop_public_page_data:${shopId}`);
  const shopSlug = updatedShop.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') || '';
  if (shopSlug) {
   await cacheService.invalidate(`shop_public_page_data:${shopSlug}`);
  }
  // Also try wildcard invalidation as a safety net
  await cacheService.invalidatePattern(`*shop_public_page_data*`);
  
  revalidatePath(`/shop/${shopId}`);
  revalidatePath(`/shop/${shopId}/config`);
  revalidatePath(`/shops/${shopId}`);
  revalidatePath(`/shops/${shopSlug}`);
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
