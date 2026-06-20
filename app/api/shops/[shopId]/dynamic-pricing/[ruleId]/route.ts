import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function PUT(request: Request, { params }: { params: Promise<{ shopId: string, ruleId: string }> }) {
  const { shopId, ruleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    const data = await request.json();
    const rule = await prisma.dynamicPricingRule.update({
      where: { id: ruleId, shopId },
      data: {
        name: data.name,
        type: data.type,
        adjustmentType: data.adjustmentType,
        adjustmentValue: data.adjustmentValue !== undefined ? parseFloat(data.adjustmentValue) : undefined,
        daysOfWeek: data.daysOfWeek !== undefined ? JSON.stringify(data.daysOfWeek) : undefined,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: data.isActive,
      }
    });
    return NextResponse.json(rule);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ shopId: string, ruleId: string }> }) {
  const { shopId, ruleId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  try {
    await prisma.dynamicPricingRule.delete({
      where: { id: ruleId, shopId }
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
