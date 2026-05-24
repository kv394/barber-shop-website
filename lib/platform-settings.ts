import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

export const getPlatformSettings = unstable_cache(
  async () => {
    // There should only be one record with id: 'global'
    const settings = await prisma.platformSettings.findUnique({
      where: { id: 'global' }
    });

    if (!settings) {
      // Return defaults if it somehow doesn't exist
      return {
        id: 'global',
        platformName: 'KutzApp',
        supportEmail: null,
        platformFeePercent: 0,
        enableSms: false,
        enableAi: true,
        logoUrl: null,
        primaryColor: '#f59e0b',
        analyticsId: null,
        updatedAt: new Date()
      };
    }

    return settings;
  },
  ['platform-settings'],
  { revalidate: 60, tags: ['platform-settings'] }
);
