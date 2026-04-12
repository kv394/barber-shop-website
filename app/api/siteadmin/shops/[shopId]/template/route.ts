import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

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

    // Set the template string to "dynamic:{id}" or just the standard name if it's a built-in one
    const updatedShop = await prisma.shop.update({
      where: { id: shopId },
      data: { template: templateId },
      select: { id: true, template: true }
    });

    return NextResponse.json({ success: true, shop: updatedShop });
  } catch (error: any) {
    console.error('Failed to assign template:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
