import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';

// ─── Constants Table ───────────────────────────────────────────────
const CONFIG = {
 MAX_OWNER_RESPONSE_LENGTH: 2000,
 HTML_STRIP_REGEX: /<[^>]*>/g,
 ROLES: {
 SITE_ADMIN: 'SITE_ADMIN',
 SHOP_ADMIN: 'SHOP_ADMIN',
 },
 HTTP_STATUS: {
 UNAUTHORIZED: 401,
 FORBIDDEN: 403,
 NOT_FOUND: 404,
 },
 ERRORS: {
 UNAUTHORIZED: 'Unauthorized',
 FORBIDDEN: 'Forbidden',
 REVIEW_NOT_FOUND: 'Review not found',
 },
} as const;

// PATCH /api/shops/[shopId]/reviews/[reviewId] — owner response
export async function PATCH(
 request: NextRequest,
 { params }: { params: Promise<{ shopId: string; reviewId: string }> }
) {
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: CONFIG.ERRORS.UNAUTHORIZED }, { status: CONFIG.HTTP_STATUS.UNAUTHORIZED });
 const { shopId, reviewId } = await params;

 // Verify caller is admin of this shop
 const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!caller || (caller.role !== CONFIG.ROLES.SITE_ADMIN && (caller.role !== CONFIG.ROLES.SHOP_ADMIN || (caller.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: caller.id, shopId } }))))))
 return NextResponse.json({ error: CONFIG.ERRORS.FORBIDDEN }, { status: CONFIG.HTTP_STATUS.FORBIDDEN });

 // SECURITY: Verify review belongs to this shop
 const existing = await prisma.review.findUnique({ where: { id: reviewId } });
 if (!existing || (existing.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: existing.id, shopId } }))))
 return NextResponse.json({ error: CONFIG.ERRORS.REVIEW_NOT_FOUND }, { status: CONFIG.HTTP_STATUS.NOT_FOUND });

 const { ownerResponse } = await request.json();
 const review = await prisma.review.update({
 where: { id: reviewId },
 data: {
 ownerResponse: ownerResponse
 ? String(ownerResponse).replace(CONFIG.HTML_STRIP_REGEX, '').slice(0, CONFIG.MAX_OWNER_RESPONSE_LENGTH)
 : null,
 respondedAt: ownerResponse ? new Date() : null,
 },
 });
 return NextResponse.json(review);
}

// DELETE /api/shops/[shopId]/reviews/[reviewId] — remove owner response
export async function DELETE(
 _: NextRequest,
 { params }: { params: Promise<{ shopId: string; reviewId: string }> }
) {
 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: CONFIG.ERRORS.UNAUTHORIZED }, { status: CONFIG.HTTP_STATUS.UNAUTHORIZED });
 const { shopId, reviewId } = await params;
 const caller = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!caller || (caller.role !== CONFIG.ROLES.SITE_ADMIN && (caller.role !== CONFIG.ROLES.SHOP_ADMIN || (caller.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: caller.id, shopId } }))))))
 return NextResponse.json({ error: CONFIG.ERRORS.FORBIDDEN }, { status: CONFIG.HTTP_STATUS.FORBIDDEN });

 // SECURITY: Verify review belongs to this shop
 const existing = await prisma.review.findUnique({ where: { id: reviewId } });
 if (!existing || (existing.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: existing.id, shopId } }))))
 return NextResponse.json({ error: CONFIG.ERRORS.REVIEW_NOT_FOUND }, { status: CONFIG.HTTP_STATUS.NOT_FOUND });

 await prisma.review.update({ where: { id: reviewId }, data: { ownerResponse: null, respondedAt: null } });
 return NextResponse.json({ ok: true });
}

