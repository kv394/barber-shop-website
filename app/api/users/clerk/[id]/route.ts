import { logger } from "@/lib/logger";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// This function handles GET requests to /api/users/clerk/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clerkId } = await params;
    if (!clerkId) {
      return NextResponse.json({ error: 'Clerk ID is required' }, { status: 400 });
    }

    // SECURITY: Only allow users to fetch their own profile,
    // or require authentication so we can scope the data.
    const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

    // If the user is fetching their own profile (common init flow), allow it
    // Otherwise deny — this prevents enumeration of all users by arbitrary Clerk ID
    if (!userId || userId !== clerkId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find the user in our database — only return safe fields
    const user = await prisma.user.findUnique({
      where: { id: clerkId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        shopId: true,
        barcode: true,
        canManageInventory: true,
        createdAt: true,
        shop: {
          select: { id: true, name: true, template: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found in our database' }, { status: 404 });
    }

    return NextResponse.json(user);

  } catch (error) {
    logger.error("Error fetching user profile:", error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
