import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Role = 'SUPER_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'CLIENT' | 'ATTENDANCE_KIOSK';

interface AuthResult {
  user: { id: string; role: string; shopId: string | null; email: string; name: string | null };
  userId: string;
}

/**
 * Centralized auth helper for API routes.
 * Verifies that the caller is authenticated AND has one of the allowed roles
 * AND belongs to the given shop (tenant isolation).
 *
 * SUPER_ADMIN bypasses shopId check.
 *
 * Returns the user record on success, or a NextResponse error on failure.
 */
export async function requireShopRole(
  shopId: string,
  allowedRoles: Role[]
): Promise<AuthResult | NextResponse> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, shopId: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  // Check role
  if (!allowedRoles.includes(user.role as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // SUPER_ADMIN can access any shop
  if (user.role === 'SUPER_ADMIN') {
    return { user, userId };
  }

  // All other roles must belong to the requested shop
  if (user.shopId !== shopId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { user, userId };
}

/**
 * Helper to check if the result is an error response.
 */
export function isAuthError(result: AuthResult | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Sanitize error messages — never leak internal details to the client.
 */
export function safeErrorResponse(error: unknown, fallbackMessage: string, status = 500): NextResponse {
  // Log the real error server-side (caller should do this via logger)
  // Return generic message to client
  return NextResponse.json({ error: fallbackMessage }, { status });
}

