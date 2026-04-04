import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let prefs = await prisma.notificationPreference.findUnique({ where: { userId } });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({ data: { userId } });
  }
  return NextResponse.json(prefs);
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();

  // SECURITY: Validate enum value for preferredChannel
  const validChannels = ['EMAIL', 'SMS', 'BOTH', 'NONE'];
  const channel = validChannels.includes(body.preferredChannel) ? body.preferredChannel : 'EMAIL';

  const data = {
    appointmentReminders: body.appointmentReminders !== undefined ? Boolean(body.appointmentReminders) : true,
    reviewRequests: body.reviewRequests !== undefined ? Boolean(body.reviewRequests) : true,
    promotions: body.promotions !== undefined ? Boolean(body.promotions) : true,
    birthdayMessages: body.birthdayMessages !== undefined ? Boolean(body.birthdayMessages) : true,
    loyaltyUpdates: body.loyaltyUpdates !== undefined ? Boolean(body.loyaltyUpdates) : true,
    preferredChannel: channel,
  };

  const prefs = await prisma.notificationPreference.upsert({
    where: { userId },
    update: data,
    create: { userId, ...data },
  });
  return NextResponse.json(prefs);
}

