import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const rules = await prisma.dynamicPricingRule.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const rule = await prisma.dynamicPricingRule.create({
      data: {
        shopId,
        name: data.name,
        type: data.type,
        adjustmentType: data.adjustmentType,
        adjustmentValue: parseFloat(data.adjustmentValue),
        daysOfWeek: data.daysOfWeek ? JSON.stringify(data.daysOfWeek) : null,
        startTime: data.startTime || null,
        endTime: data.endTime || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      }
    });
    return NextResponse.json(rule);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
