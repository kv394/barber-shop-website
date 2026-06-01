import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type Role = 'SITE_ADMIN' | 'SHOP_ADMIN' | 'STAFF' | 'BOOTH_RENTER' | 'CLIENT' | 'ATTENDANCE_KIOSK';

interface AuthResult {
  user: { id: string; role: string; shopId: string | null; email: string; name: string | null };
  userId: string;
}

/**
 * Centralized auth helper for API routes.
 * Verifies that the caller is authenticated AND has one of the allowed roles
 * AND belongs to the given shop (tenant isolation).
 *
 * SITE_ADMIN bypasses shopId check.
 *
 * Returns the user record on success, or a NextResponse error on failure.
 */
export async function requireShopRole(
  shopId: string,
  allowedRoles: Role[]
): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  if (!authUser || !authUser.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, role: true, shopId: true, email: true, name: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  const userId = user.id;


  // SITE_ADMIN bypasses all shop and role checks completely
  if (user.role === 'SITE_ADMIN') {
    return { user: { ...user, role: user.role }, userId };
  }

  // All other roles must belong to the requested shop or have a ShopAccess record
  let effectiveRole = user.role;
  if (user.shopId !== shopId) {
    const access = await prisma.shopAccess.findUnique({
      where: { userId_shopId: { userId, shopId } },
    });
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Use the ShopAccess role for authorization in this request context
    effectiveRole = access.role as any;
  }

  // Check role AFTER evaluating ShopAccess role
  if (!allowedRoles.includes(effectiveRole as Role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return { user: { ...user, role: effectiveRole }, userId };
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

