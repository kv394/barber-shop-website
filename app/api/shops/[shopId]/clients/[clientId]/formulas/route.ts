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
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF')) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { formula, notes } = body;

 if (!formula) {
 return NextResponse.json({ error: 'Missing formula text' }, { status: 400 });
 }

 const newFormula = await tenantClient.clientFormula.create({
 data: {
 formula: String(formula).trim(),
 notes: notes ? String(notes).trim() : null,
 clientId: String(clientId),
 staffId: user.id,
 shopId: String(shopId)
 }
 });

 return NextResponse.json(newFormula, { status: 201 });
 } catch (error: any) {
 logger.error("Error creating formula:", error);
 return NextResponse.json({ error: 'Failed to create formula' }, { status: 500 });
 }
}
