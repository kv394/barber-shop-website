import { prisma } from '@/lib/prisma';

/**
 * Commission calculation engine.
 *
 * Rule hierarchy (most specific wins):
 * 1. CommissionRule for specific staff + service
 * 2. CommissionRule for specific staff (any service)
 * 3. CommissionRule for specific service (any staff)
 * 4. Shop-wide CommissionRule (no staff, no service)
 * 5. User.commissionRateService / commissionRateProduct fallback
 */

export interface CommissionResult {
  ruleId: string | null;
  rateType: 'PERCENTAGE' | 'FLAT';
  rateValue: number;
  commissionAmount: number;
  source: string;
}

export async function calculateCommission(
  staffId: string,
  serviceId: string | null,
  shopId: string,
  amount: number,
  type: 'SERVICE' | 'PRODUCT' = 'SERVICE',
): Promise<CommissionResult> {
  // Fetch all applicable rules in one query, ordered by specificity
  const rules = await prisma.commissionRule.findMany({
    where: {
      shopId,
      OR: [
        { staffId, serviceId }, // Most specific
        { staffId, serviceId: null }, // Staff-only
        { staffId: null, serviceId }, // Service-only
        { staffId: null, serviceId: null }, // Shop default
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  // Pick the most specific rule
  let bestRule = null;
  let bestSpecificity = -1;

  for (const rule of rules) {
    let specificity = 0;
    if (rule.staffId && rule.serviceId) specificity = 3;
    else if (rule.staffId) specificity = 2;
    else if (rule.serviceId) specificity = 1;
    else specificity = 0;

    if (specificity > bestSpecificity) {
      bestSpecificity = specificity;
      bestRule = rule;
    }
  }

  if (bestRule) {
    const commissionAmount =
      bestRule.rateType === 'PERCENTAGE'
        ? amount * (bestRule.rateValue / 100)
        : bestRule.rateValue;

    return {
      ruleId: bestRule.id,
      rateType: bestRule.rateType as 'PERCENTAGE' | 'FLAT',
      rateValue: bestRule.rateValue,
      commissionAmount: Math.round(commissionAmount * 100) / 100,
      source: bestRule.staffId && bestRule.serviceId
        ? 'staff+service rule'
        : bestRule.staffId
        ? 'staff rule'
        : bestRule.serviceId
        ? 'service rule'
        : 'shop default rule',
    };
  }

  // Fallback to user-level commission rate
  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    select: { commissionRateService: true, commissionRateProduct: true },
  });

  const rate = type === 'SERVICE'
    ? (staff?.commissionRateService ?? 0)
    : (staff?.commissionRateProduct ?? 0);

  return {
    ruleId: null,
    rateType: 'PERCENTAGE',
    rateValue: rate,
    commissionAmount: Math.round(amount * (rate / 100) * 100) / 100,
    source: 'user fallback',
  };
}

/**
 * Calculate commissions for a batch of completed appointments.
 */
export async function calculateCommissionsForAppointments(
  shopId: string,
  appointments: Array<{
    id: string;
    staffId: string;
    serviceId: string | null;
    totalAmount: number;
    tipAmount: number;
    service: { price: number; name: string } | null;
    staff: { name: string | null } | null;
    discount: number;
  }>,
) {
  const results = [];
  for (const apt of appointments) {
    const serviceAmount = apt.totalAmount > 0
      ? apt.totalAmount - apt.tipAmount
      : (apt.service?.price || 0) - (apt.discount || 0);

    const commission = await calculateCommission(
      apt.staffId,
      apt.serviceId,
      shopId,
      serviceAmount,
    );

    results.push({
      appointmentId: apt.id,
      staffId: apt.staffId,
      staffName: apt.staff?.name || 'Unknown',
      serviceName: apt.service?.name || 'Unknown',
      serviceAmount,
      tipAmount: apt.tipAmount,
      commission: commission.commissionAmount,
      commissionSource: commission.source,
      rateType: commission.rateType,
      rateValue: commission.rateValue,
    });
  }
  return results;
}

