import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/logger';

import { requireSiteAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const settings = await prisma.platformSettings.findUnique({
    where: { id: 'global' }
  });

  if (settings) {
    const { decrypt } = await import('@/lib/encryption');
    if (settings.stripeSecretKey) settings.stripeSecretKey = decrypt(settings.stripeSecretKey);
    if (settings.stripeWebhookSecret) settings.stripeWebhookSecret = decrypt(settings.stripeWebhookSecret);
    if (settings.twilioAuthToken) settings.twilioAuthToken = decrypt(settings.twilioAuthToken);
    if (settings.openAiKey) settings.openAiKey = decrypt(settings.openAiKey);
  }

  return NextResponse.json(settings || {});
 } catch (error) {
 logger.error('Error fetching platform settings:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function PATCH(request: Request) {
 try {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

 const body = await request.json();
 
 // Whitelist editable fields
 const allowedFields = [
 'platformName', 'supportEmail', 'platformFeePercent',
 'enableSms', 'enableAi', 'logoUrl', 'primaryColor', 'analyticsId',
 'maintenanceMode', 'allowNewRegistrations', 'defaultTimezone', 'defaultCurrency',
 'stripeSecretKey', 'stripeWebhookSecret', 'twilioAccountSid', 'twilioAuthToken', 
 'twilioFromNumber', 'openAiKey', 'resendApiKey'
 ];
 
 const { encrypt } = await import('@/lib/encryption');

 const updateData: any = {};
 for (const field of allowedFields) {
 if (body[field] !== undefined) {
 if (field === 'platformFeePercent') {
 updateData[field] = parseFloat(body[field]) || 0;
 } else if (field === 'enableSms' || field === 'enableAi' || field === 'maintenanceMode' || field === 'allowNewRegistrations') {
 updateData[field] = Boolean(body[field]);
 } else if (['stripeSecretKey', 'stripeWebhookSecret', 'twilioAuthToken', 'openAiKey'].includes(field)) {
 if (body[field]) {
 updateData[field] = encrypt(body[field]);
 } else {
 updateData[field] = null;
 }
 } else {
 updateData[field] = body[field];
 }
 }
 }

 const updated = await prisma.platformSettings.upsert({
 where: { id: 'global' },
 update: updateData,
 create: {
 id: 'global',
 ...updateData
 }
 });

 // Revalidate the cache tag used by getPlatformSettings()
 revalidateTag('platform-settings');

 return NextResponse.json(updated);
 } catch (error) {
 logger.error('Error updating platform settings:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
