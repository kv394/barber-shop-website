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
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    let userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || (user.role !== 'SITE_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } }))))) {
      return new Response("Forbidden", { status: 403 });
    }

    const resources = await prisma.resource.findMany({
      where: { shopId },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(resources, { status: 200 });
  } catch (error: any) {
    logger.error("Error fetching resources:", error);
    return NextResponse.json({ error: 'Failed to fetch resources' }, { status: 500 });
  }
}

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
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    
    if (!user || (user.role !== 'SITE_ADMIN' && (user.role !== 'SHOP_ADMIN' || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))))) {
       return new Response("Forbidden", { status: 403 });
    }

    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newResource = await prisma.resource.create({
      data: {
        name: String(name).trim().slice(0, 100),
        type: String(type).trim().slice(0, 50),
        shopId: String(shopId)
      }
    });

    return NextResponse.json(newResource, { status: 201 });
  } catch (error: any) {
    logger.error("Error creating resource:", error);
    return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
  }
}
