import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { listFilesInPath } from '@/lib/google-drive';

export const dynamic = 'force-dynamic';

export async function GET(
 request: NextRequest,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 
 if (!userId) return new NextResponse("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
 return new NextResponse("Forbidden", { status: 403 });
 }

 const FOLDER_PATH = `/kutzapp/${shopId}/pictures`;
 const files = await listFilesInPath(FOLDER_PATH);

 return NextResponse.json({ files });
 } catch (error: any) {
 console.error('List files error:', error);
 return NextResponse.json({ error: error.message || 'Failed to list files' }, { status: 500 });
 }
}
