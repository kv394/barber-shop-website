import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const tiers = await prisma.saaSTier.findMany({
      orderBy: { baseFeeUSD: 'asc' }
    });

    return NextResponse.json(tiers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'SUPER_ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const updates: any[] = await request.json();

    // Iterate through updates and update each tier
    // A production app should probably validate this properly
    for (const update of updates) {
      if (update.id) {
        await prisma.saaSTier.update({
          where: { id: update.id },
          data: {
            name: update.name,
            baseFeeUSD: Number(update.baseFeeUSD),
            maxAppointments: Number(update.maxAppointments),
            maxUsers: Number(update.maxUsers),
            maxFormSubmissions: Number(update.maxFormSubmissions),
            storageLimitMB: Number(update.storageLimitMB),
            overageFeePer100MB: Number(update.overageFeePer100MB),
            description: update.description
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
