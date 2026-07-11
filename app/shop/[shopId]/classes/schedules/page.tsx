import { prisma } from '@/lib/prisma';
import ClassScheduleManager from '@/components/shop-admin/classes/ClassScheduleManager';

export default async function SchedulesPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  
  const schedules = await prisma.classSchedule.findMany({
    where: { shopId },
    include: {
      service: true,
      staff: true,
      term: true,
      _count: { select: { enrollments: true, waitlist: true } }
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  const services = await prisma.service.findMany({
    where: { shopId, isGroupClass: true }
  });

  const staff = await prisma.user.findMany({
    where: { shopId, isBookable: true }
  });

  const terms = await prisma.academicTerm.findMany({
    where: { shopId },
    orderBy: { startDate: 'desc' }
  });

  return <ClassScheduleManager shopId={shopId} schedules={schedules} services={services} staff={staff} terms={terms} />;
}
