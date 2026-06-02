import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/my-appointments
 * Returns the authenticated client's upcoming and past appointments.
 */
export async function GET(request: Request) {
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 try {
 const { searchParams } = new URL(request.url);
 const limit = parseInt(searchParams.get('limit') || '15', 10);
 const upcomingCursor = searchParams.get('upcomingCursor');
 const pastCursor = searchParams.get('pastCursor');

 const now = new Date();

 const user = await prisma.user.findFirst({
 where: { id: userId },
 select: { role: true, shopId: true },
 });

 const [upcoming, past] = await Promise.all([
 prisma.appointment.findMany({
 where: {
 OR: [
 { userId: userId },
 ...(authUserEmail ? [{ user: { email: authUserEmail } }] : [])
 ],
 status: 'SCHEDULED',
 startTime: { gte: now },
 },
 select: {
 id: true,
 startTime: true,
 endTime: true,
 status: true,
 totalAmount: true,
 tipAmount: true,
 notes: true,
 staffId: true,
 service: { select: { id: true, name: true, price: true, duration: true } },
 staff: { select: { name: true } },
 shop: { select: { id: true, name: true, timezone: true, currency: true } },
 review: { select: { id: true } },
 },
 orderBy: { startTime: 'asc' },
 take: limit + 1,
 ...(upcomingCursor ? { cursor: { id: upcomingCursor }, skip: 1 } : {}),
 }),
 prisma.appointment.findMany({
 where: {
 OR: [
 { userId: userId },
 ...(authUserEmail ? [{ user: { email: authUserEmail } }] : [])
 ],
 AND: [
 {
 OR: [
 { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
 { startTime: { lt: now }, status: 'SCHEDULED' },
 ],
 }
 ]
 },
 select: {
 id: true,
 startTime: true,
 endTime: true,
 status: true,
 totalAmount: true,
 tipAmount: true,
 notes: true,
 staffId: true,
 service: { select: { id: true, name: true, price: true, duration: true } },
 staff: { select: { name: true } },
 shop: { select: { id: true, name: true, timezone: true, currency: true } },
 review: { select: { id: true } },
 },
 orderBy: { startTime: 'desc' },
 take: limit + 1,
 ...(pastCursor ? { cursor: { id: pastCursor }, skip: 1 } : {}),
 }),
 ]);

 let nextUpcomingCursor = null;
 if (upcoming.length > limit) {
   const nextItem = upcoming.pop();
   nextUpcomingCursor = nextItem!.id;
 }

 let nextPastCursor = null;
 if (past.length > limit) {
   const nextItem = past.pop();
   nextPastCursor = nextItem!.id;
 }

 return NextResponse.json({
 upcoming: JSON.parse(JSON.stringify(upcoming)),
 past: JSON.parse(JSON.stringify(past)),
 nextUpcomingCursor,
 nextPastCursor,
 user: user,
 });
 } catch (error: any) {
 return NextResponse.json(
 { error: 'Failed to fetch appointments' },
 { status: 500 }
 );
 }
}

