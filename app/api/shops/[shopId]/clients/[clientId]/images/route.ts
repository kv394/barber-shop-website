import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF')) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { imageUrl, imageType } = body;

 if (!imageUrl) {
 return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
 }

 const newImage = await tenantClient.clientHistoryImage.create({
 data: {
 imageUrl: String(imageUrl).trim(),
 imageType: imageType ? String(imageType) : 'AFTER',
 clientId: String(clientId),
 shopId: String(shopId)
 }
 });

 return NextResponse.json(newImage, { status: 201 });
 } catch (error: any) {
 logger.error("Error adding history image:", error);
 return NextResponse.json({ error: 'Failed to add image' }, { status: 500 });
 }
}
