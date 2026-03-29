import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This is a sensitive operation, so we add an extra layer of security
    // by requiring the user to confirm their email address.
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required for confirmation' }, { status: 400 });
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Ensure the user making the request is the one being deleted
    if (!userToDelete || userToDelete.email !== email) {
      return NextResponse.json({ error: 'Forbidden: Email does not match the logged-in user' }, { status: 403 });
    }

    // Perform the deletion
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'User record deleted successfully. Please sign in again to re-initialize.' }, { status: 200 });

  } catch (error: any) {
    if (error?.digest === 'DYNAMIC_SERVER_USAGE' || error?.message?.includes('Dynamic server usage')) {
      throw error;
    }
    logger.error('Error deleting user record:', error);
    return NextResponse.json({ error: 'Failed to delete user record' }, { status: 500 });
  }
}
