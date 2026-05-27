import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF', 'ATTENDANCE_KIOSK']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const { code } = body;

 if (!code) {
 return NextResponse.json({ error: 'Code is required.' }, { status: 400 });
 }

 const giftCard = await prisma.giftCard.findUnique({
 where: { code: String(code).trim() }
 });

 if (!giftCard || (giftCard.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: giftCard.id, shopId } })))) {
 return NextResponse.json({ error: 'Invalid discount or gift card code.' }, { status: 404 });
 }

 if (giftCard.status === 'EXPIRED') {
 return NextResponse.json({ error: 'This code has expired.' }, { status: 400 });
 }

 if (giftCard.status === 'CANCELLED') {
 return NextResponse.json({ error: 'This code has been cancelled.' }, { status: 400 });
 }

 if (giftCard.status === 'REDEEMED') {
 return NextResponse.json({ error: 'This code has already been fully redeemed.' }, { status: 400 });
 }

 if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
 return NextResponse.json({ error: 'This code has expired.' }, { status: 400 });
 }

 if (giftCard.currentBalance <= 0) {
 return NextResponse.json({ error: 'This code has a zero balance.' }, { status: 400 });
 }

 return NextResponse.json({
 valid: true,
 code: giftCard.code,
 balance: giftCard.currentBalance,
 message: `Valid code. Available balance: $${giftCard.currentBalance.toFixed(2)}`
 });

 } catch (error: any) {
 console.error('Error validating code:', error);
 return NextResponse.json({ error: 'Failed to validate code.' }, { status: 500 });
 }
}
