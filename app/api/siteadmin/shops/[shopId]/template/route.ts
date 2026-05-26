import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { getOrCreateFolder, uploadFileToFolder } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

async function requireSiteAdmin() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId && !authUserEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({
    where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] },
    select: { id: true, role: true }
  });
  if (!user || user.role !== 'SITE_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { shopId } = await params;
  try {
    const { templateId } = await request.json();
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Set the template string to the template name
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { template: templateId },
      select: { id: true, template: true }
    });

    // Check if it's a dynamic template
    const dynamicTemplate = await prisma.dynamicTemplate.findUnique({
      where: { name: templateId }
    });

    if (dynamicTemplate) {
      // Copy the template to Google Drive under kutzapp / shopId
      try {
        const kutzappFolderId = await getOrCreateFolder('kutzapp');
        if (kutzappFolderId) {
          const shopFolderId = await getOrCreateFolder(shopId, kutzappFolderId);
          if (shopFolderId) {
            const templateFolderId = await getOrCreateFolder(templateId, shopFolderId);
            if (templateFolderId) {
              await uploadFileToFolder(templateFolderId, 'index.html', 'text/html', Buffer.from(dynamicTemplate.htmlCode, 'utf-8'));
              if (dynamicTemplate.cssCode) {
                await uploadFileToFolder(templateFolderId, 'styles.css', 'text/css', Buffer.from(dynamicTemplate.cssCode, 'utf-8'));
              }
            }
          }
        }
      } catch (driveError) {
        console.error('Failed to copy template to Google Drive:', driveError);
        // We don't fail the whole request if drive upload fails, 
        // because the template is still assigned in the DB.
      }
    }

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error: any) {
    console.error('Failed to assign template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
