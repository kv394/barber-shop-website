import prisma from '@/lib/prisma';
import ClassRosterView from '@/components/shop-admin/classes/ClassRosterView';

export default async function RostersPage({ params }: { params: { shopId: string } }) {
  const shopId = params.shopId;
  
  const schedules = await prisma.classSchedule.findMany({
    where: { shopId },
    include: {
      service: true,
      staff: true,
      term: true,
      enrollments: { include: { student: true } },
      waitlist: { include: { student: true }, orderBy: { position: 'asc' } }
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }]
  });

  return <ClassRosterView shopId={shopId} schedules={schedules} />;
}
