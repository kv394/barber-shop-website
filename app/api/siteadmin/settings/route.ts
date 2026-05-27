import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidateTag } from 'next/cache';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const settings = await prisma.platformSettings.findUnique({
 where: { id: 'global' }
 });

 return NextResponse.json(settings || {});
 } catch (error) {
 logger.error('Error fetching platform settings:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function PATCH(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 
 // Whitelist editable fields
 const allowedFields = [
 'platformName', 'supportEmail', 'platformFeePercent',
 'enableSms', 'enableAi', 'logoUrl', 'primaryColor', 'analyticsId',
 'maintenanceMode', 'allowNewRegistrations', 'defaultTimezone', 'defaultCurrency',
 'stripeSecretKey', 'stripeWebhookSecret', 'twilioAccountSid', 'twilioAuthToken', 
 'twilioFromNumber', 'openAiKey', 'resendApiKey'
 ];
 
 const updateData: any = {};
 for (const field of allowedFields) {
 if (body[field] !== undefined) {
 if (field === 'platformFeePercent') {
 updateData[field] = parseFloat(body[field]) || 0;
 } else if (field === 'enableSms' || field === 'enableAi' || field === 'maintenanceMode' || field === 'allowNewRegistrations') {
 updateData[field] = Boolean(body[field]);
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
