import { getTenantClient } from '@/lib/prisma';

/** Add loyalty points to a member */
export async function addPoints(args: { memberId: string; points: number }, shopId: string) {
  const db = getTenantClient(shopId);
  const member = await db.member.update({
    where: { id: args.memberId },
    data: { points: { increment: args.points } },
  });
  return member;
}

/** Get loyalty tier of a member */
export async function getMemberTier(args: { memberId: string }, shopId: string) {
  const db = getTenantClient(shopId);
  const member = await db.member.findUnique({ where: { id: args.memberId } });
  return { tier: member?.tier };
}

/** List loyalty rewards */
export async function listRewards(_args: {}, shopId: string) {
  const db = getTenantClient(shopId);
  const rewards = await db.reward.findMany();
  return rewards;
}
