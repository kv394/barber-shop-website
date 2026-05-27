import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

function generateReferralCode(): string {
 const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
 const bytes = crypto.randomBytes(8);
 let code = '';
 for (let i = 0; i < 8; i++) {
 code += chars.charAt(bytes[i] % chars.length);
 }
 return code;
}

// GET - List referrals for a shop (admin) or for current user (client)
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId: paramShopId } = await params;
 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 const shopId = resolvedShop.id;

 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

 // SECURITY: Verify user has a relationship with this shop
 if (user.role !== 'SITE_ADMIN') {
 if (['SHOP_ADMIN', 'STAFF'].includes(user.role) && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 // For clients, verify they have at least one appointment at this shop or are assigned to it
 if (user.role === 'CLIENT' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 const hasAppointment = await prisma.appointment.findFirst({
 where: { userId: user.id, shopId },
 select: { id: true },
 });
 if (!hasAppointment) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 }
 }

 // Ensure user has a referral code
 if (!user.referralCode) {
 const code = generateReferralCode();
 await prisma.user.update({
 where: { id: userId },
 data: { referralCode: code },
 });
 user.referralCode = code;
 }

 // Admin sees all referrals for the shop
 if (['SITE_ADMIN', 'SHOP_ADMIN'].includes(user.role)) {
 // Tenant isolation: SHOP_ADMIN must belong to this shop
 if (user.role === 'SHOP_ADMIN' && (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }
 const referrals = await prisma.referral.findMany({
 where: { shopId },
 include: {
 referredBy: { select: { id: true, name: true, email: true } },
 referredClient: { select: { id: true, name: true, email: true } },
 },
 orderBy: { createdAt: 'desc' },
 take: 100,
 });

 const stats = {
 total: referrals.length,
 completed: referrals.filter((r: any) => r.status === 'COMPLETED' || r.status === 'REWARDED').length,
 pending: referrals.filter((r: any) => r.status === 'PENDING').length,
 };

 return NextResponse.json({ referrals, stats, referralCode: user.referralCode });
 }

 // Client sees their own referrals
 const referrals = await prisma.referral.findMany({
 where: { shopId, referrerId: userId },
 include: {
 referredClient: { select: { name: true } },
 },
 orderBy: { createdAt: 'desc' },
 });

 return NextResponse.json({ referrals, referralCode: user.referralCode });
 } catch (error) {
 logger.error('Error fetching referrals:', error);
 return NextResponse.json({ error: 'Failed to fetch referrals' }, { status: 500 });
 }
}

// POST - Register a referral (when a new client signs up with a referral code)
export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId: paramShopId } = await params;
 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 const shopId = resolvedShop.id;

 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const body = await request.json();
 const { referralCode } = body;

 if (!referralCode) {
 return NextResponse.json({ error: 'Referral code required' }, { status: 400 });
 }

 // Find referrer by code
 const referrer = await prisma.user.findUnique({
 where: { referralCode },
 });

 if (!referrer) {
 return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
 }

 if (referrer.id === userId) {
 return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
 }

 // Check if referee already has a referral for this shop
 const existing = await prisma.referral.findUnique({
 where: { shopId_refereeId: { shopId, refereeId: userId } },
 });

 if (existing) {
 return NextResponse.json({ error: 'Already referred to this shop' }, { status: 400 });
 }

 const referral = await prisma.referral.create({
 data: {
 shopId,
 referrerId: referrer.id,
 refereeId: userId,
 status: 'PENDING',
 },
 });

 return NextResponse.json(referral, { status: 201 });
 } catch (error) {
 logger.error('Error creating referral:', error);
 return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 });
 }
}

