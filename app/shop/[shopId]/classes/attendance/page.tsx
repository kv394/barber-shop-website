import { prisma } from '@/lib/prisma';
import AttendanceTracker from '@/components/shop-admin/classes/AttendanceTracker';

export default async function AttendancePage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  
  // For demo purposes, we're fetching sessions for today, but right now we'll just fetch all sessions
  const sessions = await prisma.classSession.findMany({
    where: { 
      classSchedule: { shopId }
    },
    include: {
      classSchedule: {
        include: { service: true }
      },
      attendances: {
        include: { student: true }
      }
    },
    orderBy: { date: 'asc' }
  });

  return <AttendanceTracker shopId={shopId} sessions={sessions} />;
}
