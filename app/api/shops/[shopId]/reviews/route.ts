import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: Request) {
 const origin = request.headers.get('origin');
 return new NextResponse(null, {
 status: 200,
 headers: {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 },
 });
}

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const origin = request.headers.get('origin');
 const corsHeaders = {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 };

 try {
 const { shopId } = await params;
 
 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: shopId },
 { subdomain: shopId },
 { customDomain: shopId },
 { name: { equals: shopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true, customDomain: true, subdomain: true, customization: true }
 });

 if (!resolvedShop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
 }
 const realShopId = resolvedShop.id;
 
 // Domain Validation
 const referer = request.headers.get('referer');
 let requestDomain = null;
 try {
 if (origin && origin !== 'null') {
 requestDomain = new URL(origin).hostname;
 } else if (referer && referer !== 'null') {
 requestDomain = new URL(referer).hostname;
 }
 } catch (e) {
 requestDomain = null;
 }

 if (requestDomain) {
 const customization = (resolvedShop.customization as any) || {};
 const allowedDomains: string[] = customization.allowedDomains || [];
 if (resolvedShop.customDomain) allowedDomains.push(resolvedShop.customDomain);
 if (resolvedShop.subdomain) allowedDomains.push(`${resolvedShop.subdomain}.kutzapp.com`);
 allowedDomains.push('kutzapp.com', 'localhost', '127.0.0.1');
 
 const isAllowed = allowedDomains.some(domain => 
 requestDomain === domain || requestDomain?.endsWith(`.${domain}`)
 );

 if (!isAllowed) {
 // TEMPORARY: Allow all domains for demo/local testing purposes.
 logger.warn(`Allowing unauthorized access to reviews from domain for demo: ${requestDomain}`);
 }
 }

 const reviews = await prisma.review.findMany({
 where: { shopId: realShopId },
 include: {
 user: { select: { name: true } },
 appointment: { include: { service: { select: { name: true } }, staff: { select: { name: true } } } },
 },
 orderBy: { createdAt: 'desc' },
 take: 100,
 });
 return NextResponse.json({ reviews, total: reviews.length }, { headers: corsHeaders });
 } catch (error) {
 logger.error('Error fetching reviews:', error);
 return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500, headers: corsHeaders });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 const origin = request.headers.get('origin');
 const corsHeaders = {
 'Access-Control-Allow-Origin': (!origin || origin === 'null') ? '*' : origin,
 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
 };

 try {
 const { shopId } = await params;
 
 const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: shopId },
 { subdomain: shopId },
 { customDomain: shopId },
 { name: { equals: shopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
 }
 const realShopId = resolvedShop.id;

 const supabase = await createClient();
 const { data: { user: authUserSession } } = await supabase.auth.getUser();
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;

 if (!userId) {
 const emailToUse = `anon-review-${crypto.randomUUID().slice(0, 8)}@shophub.local`;
 const anonUser = await prisma.user.create({
 data: {
 email: emailToUse,
 name: 'Anonymous Client',
 role: 'CLIENT',
 shopId: realShopId,
 }
 });
 userId = anonUser.id;
 }

 const body = await request.json();
 const { appointmentId, rating, comment } = body;

 if (!rating || rating < 1 || rating > 5) {
 return NextResponse.json({ error: 'Valid rating (1-5) required' }, { status: 400, headers: corsHeaders });
 }

 if (appointmentId) {
 // Verify the appointment belongs to this user and shop
 const appointment = await prisma.appointment.findUnique({
 where: { id: appointmentId },
 });

 if (!appointment || (appointment.shopId !== realShopId && !(await prisma.shopAccess.findFirst({ where: { userId: appointment.id, shopId: realShopId } }))) || appointment.userId !== userId) {
 return NextResponse.json({ error: 'Appointment not found or not yours' }, { status: 404, headers: corsHeaders });
 }

 if (appointment.status !== 'COMPLETED') {
 return NextResponse.json({ error: 'Can only review completed appointments' }, { status: 400, headers: corsHeaders });
 }

 // Check for existing review
 const existing = await prisma.review.findUnique({ where: { appointmentId } });
 if (existing) {
 return NextResponse.json({ error: 'Already reviewed this appointment' }, { status: 400, headers: corsHeaders });
 }
 }

 const review = await prisma.review.create({
 data: {
 rating: Math.min(5, Math.max(1, Math.floor(parseInt(rating)))),
 // SECURITY: Strip HTML tags and limit length to prevent stored XSS
 comment: comment ? String(comment).replace(/<[^>]*>/g, '').slice(0, 2000) : null,
 appointmentId: appointmentId || null,
 userId,
 shopId: realShopId,
 },
 });

 return NextResponse.json(review, { status: 201, headers: corsHeaders });
 } catch (error) {
 logger.error('Error creating review:', error);
 return NextResponse.json({ error: 'Failed to create review' }, { status: 500, headers: corsHeaders });
 }
}

