'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function sendBroadcast(data: FormData) {
  const title = data.get('title') as string;
  const message = data.get('message') as string;
  const target = data.get('target') as string;

  if (!title || !message) {
    return { error: 'Title and message are required' };
  }

  try {
    // Save as SystemLog for persistence
    await prisma.systemLog.create({
      data: {
        level: 'BROADCAST',
        message: title,
        metadata: {
          content: message,
          target: target,
        },
      },
    });

    revalidatePath('/siteadmin/support');
    return { success: true };
  } catch (error: any) {
    console.error('Error sending broadcast:', error);
    return { error: 'Failed to send broadcast' };
  }
}
