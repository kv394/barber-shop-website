'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateSchedule(formData: FormData) {
  const staffId = formData.get('staffId') as string;
  const shopId = formData.get('shopId') as string;
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const workingHours: any = {};

  for (const day of days) {
    const isEnabled = formData.get(`${day}-enabled`) === 'on';
    if (isEnabled) {
      workingHours[day] = {
        open: formData.get(`${day}-open`),
        close: formData.get(`${day}-close`),
      };
    } else {
      workingHours[day] = null;
    }
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { workingHours },
  });

  revalidatePath(`/shop/${shopId}/settings/team`);
  redirect(`/shop/${shopId}/settings/team`);
}

export async function addLeave(formData: FormData) {
  const staffId = formData.get('staffId') as string;
  const date = formData.get('date') as string;
  const startTime = formData.get('startTime') as string;
  const endTime = formData.get('endTime') as string;
  const reason = formData.get('reason') as string;
  const shopId = formData.get('shopId') as string;

  if (!staffId || !date || !shopId) return;

  const startDate = new Date(`${date}T${startTime || '00:00'}:00Z`);
  const endDate = new Date(`${date}T${endTime || '23:59'}:00Z`);

  await prisma.leave.create({
    data: { userId: staffId, shopId, date: new Date(date), startTime: startDate, endTime: endDate, reason },
  });
  revalidatePath(`/shop/${shopId}/settings/team/${staffId}/schedule`);
}

export async function deleteLeave(formData: FormData) {
  const leaveId = formData.get('leaveId') as string;
  const staffId = formData.get('staffId') as string;
  const shopId = formData.get('shopId') as string;
  
  if (!leaveId || !shopId) return;

  await prisma.leave.delete({ where: { id: leaveId } });
  revalidatePath(`/shop/${shopId}/settings/team/${staffId}/schedule`);
}
