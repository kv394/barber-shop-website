import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const kioskUser = await prisma.user.findFirst({ where: { role: 'ATTENDANCE_KIOSK' }});
  if (!kioskUser) return NextResponse.json({ error: "No Kiosk User" });

  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = usersData?.users?.find((u: any) => u.email === kioskUser.email);
  
  return NextResponse.json({
    kioskLocal: kioskUser,
    supabaseUser: sbUser,
  });
}
