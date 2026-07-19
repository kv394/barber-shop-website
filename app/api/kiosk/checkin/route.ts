import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: appointmentId }
    });

    if (!appt) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        // @ts-ignore
        attendanceStatus: 'PRESENT',
        status: 'COMPLETED'
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Kiosk checkin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
