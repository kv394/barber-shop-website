import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Use this to ensure the page caches effectively unless revalidated
export const revalidate = 60;

// This function handles GET requests to /api/users/clerk/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const clerkId = params.id;

    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 });
    }

    // Find the user in our database that matches the Clerk ID
    const user = await prisma.user.findUnique({
      where: {
        id: clerkId,
      },
      include: {
        shop: true, // Also include the shop data if the user belongs to one
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in our database' }, { status: 404 });
    }

    // Return the user's profile
    return NextResponse.json(user);

  } catch (error) {
    logger.error("Error fetching user profile:", error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
