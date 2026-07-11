'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createSemester(formData: FormData) {
  const shopId = formData.get('shopId') as string;
  const name = formData.get('name') as string;
  const startDate = new Date(formData.get('startDate') as string);
  const endDate = new Date(formData.get('endDate') as string);

  try {
    await prisma.academicTerm.create({
      data: {
        shopId,
        name,
        startDate,
        endDate
      }
    });

    revalidatePath(`/shop/${shopId}/classes/semesters`);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating semester:', error);
    return { success: false, error: error.message };
  }
}

export async function createSchedule(formData: FormData) {
  const shopId = formData.get('shopId') as string;
  const serviceId = formData.get('serviceId') as string;
  const termId = formData.get('termId') as string;
  const staffId = formData.get('staffId') as string;
  const dayOfWeek = parseInt(formData.get('dayOfWeek') as string, 10);
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;

  try {
    await prisma.classSchedule.create({
      data: {
        shopId,
        serviceId,
        termId: termId || null,
        staffId,
        dayOfWeek,
        startTime,
        endTime
      }
    });

    revalidatePath(`/shop/${shopId}/classes/schedules`);
    return { success: true };
  } catch (error: any) {
    console.error('Error creating schedule:', error);
    return { success: false, error: error.message };
  }
}
