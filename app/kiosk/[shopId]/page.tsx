import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { KioskClient } from './KioskClient';
import { startOfDay, endOfDay } from 'date-fns';

export default async function KioskPage({ params }: { params: Promise<{ shopId: string }> }) {
  const resolvedParams = await params;
  const shop = await prisma.shop.findUnique({
    where: { id: resolvedParams.shopId, shopType: 'DANCE_STUDIO' }
  });

  if (!shop) {
    return notFound();
  }

  // Get today's classes and students
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const todaysAppointments = await prisma.appointment.findMany({
    where: {
      shopId: shop.id,
      startTime: { gte: start, lte: end },
      status: 'SCHEDULED'
    },
    include: {
      service: true,
      user: true
    },
    orderBy: { startTime: 'asc' }
  });

  // Group appointments by Service (Class)
  const classesMap = new Map<string, any>();
  todaysAppointments.forEach(appt => {
    if (!appt.service) return;
    const classId = appt.service.id + '_' + appt.startTime.getTime();
    if (!classesMap.has(classId)) {
      classesMap.set(classId, {
        service: appt.service,
        startTime: appt.startTime,
        endTime: appt.endTime,
        students: []
      });
    }
    const classData = classesMap.get(classId);
    classData.students.push({
      appointmentId: appt.id,
      user: appt.user,
      // @ts-ignore
      status: appt.attendanceStatus
    });
  });

  const classes = Array.from(classesMap.values());

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-black bg-gradient-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
            {shop.name} Kiosk
          </h1>
          <p className="text-xl text-zinc-400 mt-2">Tap your name to check in to class</p>
        </header>
        
        <KioskClient shopId={shop.id} classes={classes} />
      </div>
    </div>
  );
}
