import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const kioskUsers = await prisma.user.findMany({ where: { role: 'ATTENDANCE_KIOSK' } });
    if (kioskUsers.length === 0) return NextResponse.json({ error: "No kiosk users found in Prisma" });
    
    const testKiosk = kioskUsers[0];
    
    let targetSupabaseId;
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    const existingSupabaseUser = usersData.users.find((u: any) => u.email === testKiosk.email);
    
    if (existingSupabaseUser) {
      targetSupabaseId = existingSupabaseUser.id;
      const res = await supabaseAdmin.auth.admin.updateUserById(targetSupabaseId, {
        password: 'kioskpassword123',
        email_confirm: true,
      });
      if (res.error) throw res.error;
    } else {
      const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
        email: testKiosk.email,
        password: 'kioskpassword123',
        email_confirm: true,
      });
      if (error) throw error;
      targetSupabaseId = newUser.user.id;
    }
    
    await prisma.user.update({
      where: { email: testKiosk.email },
      data: { id: targetSupabaseId }
    });
    
    const supabaseClient = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: testKiosk.email,
      password: 'kioskpassword123'
    });
    
    return NextResponse.json({
      kioskUser: testKiosk,
      authResult: authData?.user?.id || null,
      authError: authError?.message || null,
      syncedId: targetSupabaseId
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack });
  }
}
