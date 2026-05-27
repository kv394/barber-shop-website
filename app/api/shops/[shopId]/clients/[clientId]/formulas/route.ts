import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string; clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF')) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { formula, notes } = body;

 if (!formula) {
 return NextResponse.json({ error: 'Missing formula text' }, { status: 400 });
 }

 const newFormula = await prisma.clientFormula.create({
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
