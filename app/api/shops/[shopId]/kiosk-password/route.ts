import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is SHOP_ADMIN or SITE_ADMIN for this shop
    const currentUser = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!currentUser || (currentUser.role !== 'SITE_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== shopId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // SECURITY: Enforce minimum password length
    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // SECURITY: Verify the target email belongs to a kiosk user of THIS shop
    // Prevents a SHOP_ADMIN from changing passwords for users in other shops
    const targetUser = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!targetUser || targetUser.shopId !== shopId || targetUser.role !== 'ATTENDANCE_KIOSK') {
      return NextResponse.json({ error: 'Target user must be a kiosk account for this shop' }, { status: 403 });
    }

    const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create or update user in Supabase
    let targetSupabaseId = targetUser.id; // Initially assume the Prisma ID is the Supabase ID

    // Let's try to update the user first, assuming they exist and the ID is in sync
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetSupabaseId, {
      password: password,
      email_confirm: true,
    });

    if (updateError) {
       // If update fails (e.g. user not found), try to create them instead
       const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
       });

       if (createError) {
          // If creation fails because they already exist, we need to find them and update them
          // Since we can't reliably use listUsers, let's use the Admin API to get the user by email
          // Wait, there's no direct "getUserByEmail" in Supabase JS v2 Admin API.
          // But we can just use the create user error to see if it exists.
          logger.error('Supabase createUser error:', createError);
          throw createError;
       }
       targetSupabaseId = newUser.user.id;
    }
    
    // Ensure our local DB is synced with the correct Supabase ID
    await prisma.user.update({
        where: { email: email },
        data: { id: targetSupabaseId }
    });

    return NextResponse.json({ success: true, message: 'Kiosk password set successfully.' });

  } catch (error: any) {
    logger.error('Error setting kiosk password:', error);
    return NextResponse.json({ error: 'Failed to set password.' }, { status: 500 });
  }
}
