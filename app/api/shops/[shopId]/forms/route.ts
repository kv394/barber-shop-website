import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
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
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || ((user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const forms = await tenantClient.formTemplate.findMany({
 where: { shopId },
 orderBy: { name: 'asc' }
 });

 return NextResponse.json(forms, { status: 200 });
 } catch (error: any) {
 logger.error("Error fetching forms:", error);
 return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
 }
}

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
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || ((user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { name, content, isRequired } = body;

 if (!name || !content) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 const newForm = await tenantClient.formTemplate.create({
 data: {
 name: String(name).trim().slice(0, 100),
 content: String(content).trim(),
 isRequired: Boolean(isRequired),
 shopId: String(shopId)
 }
 });

 return NextResponse.json(newForm, { status: 201 });
 } catch (error: any) {
 logger.error("Error creating form:", error);
 return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
 }
}
