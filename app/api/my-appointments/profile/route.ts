import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: {
      id: true, name: true, email: true, phone: true,
      preferences: true, allergies: true, birthday: true,
      marketingConsent: true, smsConsent: true, imageUrl: true,
      barcode: true, shopId: true, role: true,
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const updateData: Record<string, any> = {};

  // SECURITY: Sanitize all text inputs — strip HTML and limit lengths
  if (body.name !== undefined) updateData.name = typeof body.name === 'string' ? body.name.replace(/<[^>]*>/g, '').trim().slice(0, 200) || null : null;
  if (body.phone !== undefined) updateData.phone = typeof body.phone === 'string' ? body.phone.replace(/[^0-9+\-() ]/g, '').trim().slice(0, 30) || null : null;
  if (body.preferences !== undefined) updateData.preferences = typeof body.preferences === 'string' ? body.preferences.replace(/<[^>]*>/g, '').trim().slice(0, 2000) || null : null;
  if (body.allergies !== undefined) updateData.allergies = typeof body.allergies === 'string' ? body.allergies.replace(/<[^>]*>/g, '').trim().slice(0, 2000) || null : null;
  if (body.birthday !== undefined) {
    if (body.birthday) {
      const d = new Date(body.birthday);
      updateData.birthday = isNaN(d.getTime()) ? null : d;
    } else {
      updateData.birthday = null;
    }
  }
  if (body.marketingConsent !== undefined) updateData.marketingConsent = Boolean(body.marketingConsent);
  if (body.smsConsent !== undefined) updateData.smsConsent = Boolean(body.smsConsent);

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true, name: true, email: true, phone: true,
      preferences: true, allergies: true, birthday: true,
      marketingConsent: true, smsConsent: true, imageUrl: true,
      barcode: true, shopId: true, role: true,
    },
  });
  return NextResponse.json(updated);
}

