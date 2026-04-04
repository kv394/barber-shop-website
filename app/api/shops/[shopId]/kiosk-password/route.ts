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
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is SHOP_ADMIN or SUPER_ADMIN for this shop
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== shopId))) {
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

    // Find if the user exists in Clerk by email
    const client = await clerkClient();
    const clerkUsersResponse = await client.users.getUserList({ emailAddress: [email] });
    const clerkUsers = clerkUsersResponse.data;

    let targetClerkId: string;

    if (clerkUsers.length > 0) {
      // User exists in Clerk, just update their password
      targetClerkId = clerkUsers[0].id;
      await client.users.updateUser(targetClerkId, {
        password: password,
        skipPasswordChecks: true,
      });
    } else {
      // User does not exist in Clerk, create them with the email pre-verified.
      const newClerkUser = await client.users.createUser({
        emailAddress: [email],
        password: password,
        skipPasswordChecks: true,
      } as any);
      targetClerkId = newClerkUser.id;
    }
    
    // Ensure our local DB is synced with the correct Clerk ID
    await prisma.user.update({
        where: { email: email },
        data: { id: targetClerkId }
    });

    return NextResponse.json({ success: true, message: 'Kiosk password set successfully.' });

  } catch (error: any) {
    logger.error('Error setting kiosk password:', error);
    return NextResponse.json({ error: 'Failed to set password.' }, { status: 500 });
  }
}
