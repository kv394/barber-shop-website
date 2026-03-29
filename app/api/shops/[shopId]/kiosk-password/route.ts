import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is SHOP_ADMIN or SUPER_ADMIN for this shop
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser || (currentUser.role !== 'SUPER_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || currentUser.shopId !== params.shopId))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    
    // Find if the user exists in Clerk by email
    const clerkUsers = await clerkClient.users.getUserList({ emailAddress: [email] });

    let targetClerkId: string;

    if (clerkUsers.length > 0) {
      // User exists in Clerk, just update their password
      targetClerkId = clerkUsers[0].id;
      await clerkClient.users.updateUser(targetClerkId, { 
        password: password,
        skipPasswordChecks: true,
      });
    } else {
      // User does not exist in Clerk, create them with the email pre-verified.
      const newClerkUser = await clerkClient.users.createUser({
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
    const clerkError = error.errors?.[0]?.longMessage;
    return NextResponse.json({ error: clerkError || 'Failed to set password.' }, { status: 500 });
  }
}
