import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSiteAdmin } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await request.json();
    const { action, name, email, block } = body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    if (action === 'reset-password') {
      // Send password reset using Supabase Admin
      const { error } = await supabaseAdmin.auth.resetPasswordForEmail(user.email);
      if (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Password reset email sent' });
    }

    if (action === 'block' || action === 'unblock') {
      const banDuration = action === 'block' ? '876000h' : 'none'; // 100 years or none
      
      // Get the Supabase user id using email
      const { data: authUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
      if (searchError) {
        return NextResponse.json({ error: searchError.message }, { status: 500 });
      }
      
      const authUser = authUsers.users.find(u => u.email === user.email);
      if (!authUser) {
        return NextResponse.json({ error: 'User not found in auth system' }, { status: 404 });
      }

      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
        ban_duration: banDuration
      });

      if (banError) {
        return NextResponse.json({ error: banError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: `User ${action}ed successfully` });
    }

    // Default action: Update profile
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    if (Object.keys(updateData).length > 0) {
      // Update Prisma
      await prisma.user.update({
        where: { id },
        data: updateData,
      });

      // Update Supabase Auth if email changed
      if (email && email !== user.email) {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authUser = authUsers?.users.find(u => u.email === user.email);
        
        if (authUser) {
          await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
            email: email,
            email_confirm: true,
          });
        }
      }
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
