import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';
import { z } from 'zod';

// Validation schema for dynamic pricing rules
const pricingRuleSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['SURGE', 'DISCOUNT']),
  adjustmentType: z.enum(['PERCENTAGE', 'FLAT']),
  adjustmentValue: z.number().min(-100).max(1000),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export async function GET(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;

  // SECURITY: Verify user has SHOP_ADMIN role in this shop
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  const rules = await prisma.dynamicPricingRule.findMany({
    where: { shopId },
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;

  // SECURITY: Verify user has SHOP_ADMIN role in this shop
  const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const data = await request.json();

    // SECURITY: Validate input with Zod to prevent injection and bounds violations
    const validationResult = pricingRuleSchema.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid pricing rule data', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const validated = validationResult.data;

    const rule = await prisma.dynamicPricingRule.create({
      data: {
        shopId,
        name: validated.name,
        type: validated.type,
        adjustmentType: validated.adjustmentType,
        adjustmentValue: validated.adjustmentValue,
        daysOfWeek: validated.daysOfWeek ? JSON.stringify(validated.daysOfWeek) : null,
        startTime: validated.startTime || null,
        endTime: validated.endTime || null,
        isActive: validated.isActive,
      }
    });
    return NextResponse.json(rule);
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to create pricing rule' }, { status: 500 });
  }
}
