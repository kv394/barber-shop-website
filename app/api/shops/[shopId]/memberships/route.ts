import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const memberships = await prisma.membershipTier.findMany({
 where: { shopId },
 orderBy: { price: 'asc' }
 });

 return NextResponse.json(memberships, { status: 200 });
 } catch (error: any) {
 logger.error("Error fetching memberships:", error);
 return NextResponse.json({ error: 'Failed to fetch memberships' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return new Response("Unauthorized", { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 
 if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
 return new Response("Forbidden", { status: 403 });
 }

 const body = await request.json();
 const { name, description, price, interval } = body;

 if (!name || price === undefined || !interval) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 const newMembership = await prisma.membershipTier.create({
 data: {
 name: String(name).trim().slice(0, 100),
 description: description ? String(description).trim().slice(0, 500) : null,
 price: Number(price),
 interval: String(interval).trim().slice(0, 20),
 shopId: String(shopId)
 }
 });

 return NextResponse.json(newMembership, { status: 201 });
 } catch (error: any) {
 logger.error("Error creating membership:", error);
 return NextResponse.json({ error: 'Failed to create membership' }, { status: 500 });
 }
}
