import { getTenantClient } from '@/lib/prisma';

/** Add loyalty points to a member */
export async function addPoints(args: { memberId: string; points: number }, shopId: string) {
  const db = await getTenantClient(shopId);
  const member = await db.loyaltyAccount.update({
    where: { id: args.memberId },
    data: { pointsBalance: { increment: args.points }, totalEarned: { increment: args.points }, lifetimePoints: { increment: args.points } },
  });
  return member;
}

/** Get loyalty tier of a member */
export async function getMemberTier(args: { memberId: string }, shopId: string) {
  const db = await getTenantClient(shopId);
  const member = await db.loyaltyAccount.findUnique({ where: { id: args.memberId } });
  return { tier: member?.currentTier };
}

/** List loyalty rewards */
export async function listRewards(_args: {}, shopId: string) {
  const db = await getTenantClient(shopId);
  // Replaced with getting loyalty programs since reward model doesn't exist
  const rewards = await db.loyaltyProgram.findMany({ where: { shopId } });
  return rewards;
}
