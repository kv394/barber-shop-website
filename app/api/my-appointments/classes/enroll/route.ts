import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const enrollSchema = z.object({
  classScheduleId: z.string(),
  studentId: z.string()
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classScheduleId, studentId } = enrollSchema.parse(body);

    const parent = await prisma.user.findUnique({
      where: { email: authUser.email },
      include: { dependents: true }
    });

    if (!parent) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify studentId belongs to parent or is parent
    const familyIds = [parent.id, ...parent.dependents.map(d => d.id)];
    if (!familyIds.includes(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 403 });
    }

    // Verify schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: classScheduleId }
    });

    if (!schedule) {
      return NextResponse.json({ error: 'Class schedule not found' }, { status: 404 });
    }

    // Check for existing active enrollment
    const existing = await prisma.classEnrollment.findFirst({
      where: {
        classScheduleId,
        studentId,
        status: 'ACTIVE'
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Student is already enrolled in this class' }, { status: 400 });
    }

    const enrollment = await prisma.classEnrollment.create({
      data: {
        classScheduleId,
        studentId,
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ enrollment });
  } catch (error: any) {
    console.error('Error enrolling in class:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to enroll in class' }, { status: 500 });
  }
}
