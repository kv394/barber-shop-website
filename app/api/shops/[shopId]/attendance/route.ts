import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 // Require at least STAFF role to view active attendance logs
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'STAFF', 'ATTENDANCE_KIOSK']);
 if (isAuthError(authResult)) return authResult;

 // Find all active time logs for the given shop
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 const activeLogs = await tenantClient.timeLog.findMany({
 where: {
 shopId: shopId,
 clockIn: {
 gte: today, // Only show logs from today
 },
 clockOut: null, // Only show users who are currently clocked IN
 },
 include: {
 user: {
 select: {
 name: true,
 email: true,
 }
 }
 },
 orderBy: {
 clockIn: 'asc'
 }
 });

 return NextResponse.json(activeLogs);

 } catch (error: any) {
 logger.error('Error fetching active logs:', error);
 return NextResponse.json({ error: 'Failed to fetch active logs' }, { status: 500 });
 }
}


export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: _authUser } } = await supabase.auth.getUser();
  const session = _authUser ? { user: _authUser } : null;
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;

 // Verify the scanner device is logged in. 
 // It can be a Shop Admin, Staff, or a dedicated KIOSK user.
 if (!userId) {
 return NextResponse.json({ error: 'Scanner device is unauthorized' }, { status: 401 });
 }

 const scannerUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });

 if (!scannerUser || 
 (scannerUser.role !== 'SHOP_ADMIN' && 
 scannerUser.role !== 'STAFF' &&
 scannerUser.role !== 'ATTENDANCE_KIOSK')) {
 return NextResponse.json({ error: 'This device does not have permission to scan.' }, { status: 403 });
 }

 // Ensure the scanner is assigned to this shop (unless Site Admin)
 if ((scannerUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: scannerUser.id, shopId } })))) {
 return NextResponse.json({ error: 'This device is not assigned to this shop.' }, { status: 403 });
 }

 const body = await request.json();
 const { barcode, direct } = body;

 let user;

 if (direct) {
 // Direct clock in/out by the logged in user
 user = scannerUser;
 } else {
 if (!barcode) {
 return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
 }

 // Find the user by their barcode AND ensure they belong to this shop
 user = await tenantClient.user.findFirst({
 where: {
 barcode: barcode,
 shopId: shopId,
 },
 });

 if (!user) {
 return NextResponse.json({ error: 'ID Card not recognized for this shop.' }, { status: 404 });
 }
 }

 // If the scanned user is a CLIENT, they are checking in to the waitlist, not clocking in for a shift
 if (user.role === 'CLIENT') {
 const today = new Date();
 today.setHours(0, 0, 0, 0);

 // Check if they are already on the waitlist today
 const existingEntry = await tenantClient.waitlist.findFirst({
 where: {
 shopId: shopId,
 clientName: user.name || user.email,
 createdAt: { gte: today },
 status: { in: ['WAITING', 'SERVING'] }
 }
 });

 if (existingEntry) {
 return NextResponse.json({ 
 message: 'You are already on the waitlist!', 
 user: { name: user.name || user.email }, 
 role: user.role,
 action: 'IN',
 time: existingEntry.createdAt
 }, { status: 200 });
 }

 // Add to waitlist
 const newEntry = await tenantClient.$transaction(async (tx: any) => {
 const lastEntry = await tx.waitlist.findFirst({
 where: { shopId: shopId, createdAt: { gte: today } },
 orderBy: { position: 'desc' },
 });

 return tx.waitlist.create({
 data: {
 clientName: (user.name || user.email).slice(0, 200),
 position: (lastEntry?.position || 0) + 1,
 shopId: shopId,
 status: 'WAITING'
 },
 });
 }, { isolationLevel: 'Serializable' });

 return NextResponse.json({ 
 message: 'Added to the waitlist successfully!',
 user: { name: user.name || user.email },
 role: user.role,
 action: 'IN',
 time: newEntry.createdAt
 }, { status: 200 });
 }

 // Staff / Admin logic: Check if they are already clocked in (have a TimeLog with no clockOut)
 const activeLog = await tenantClient.timeLog.findFirst({
 where: {
 userId: user.id,
 shopId: shopId,
 clockOut: null,
 },
 });

 if (activeLog) {
 // They are checked in, so check them OUT
 const updatedLog = await tenantClient.timeLog.update({
 where: { id: activeLog.id },
 data: { clockOut: new Date() },
 });
 return NextResponse.json({ 
 message: 'Checked OUT successfully', 
 user: { name: user.name || user.email }, 
 role: user.role,
 action: 'OUT',
 time: updatedLog.clockOut
 }, { status: 200 });
 } else {
 // They are not checked in, so check them IN
 const newLog = await tenantClient.timeLog.create({
 data: {
 userId: user.id,
 shopId: shopId,
 // clockIn is automatically set to now()
 },
 });
 return NextResponse.json({ 
 message: 'Checked IN successfully',
 user: { name: user.name || user.email },
 role: user.role,
 action: 'IN',
 time: newLog.clockIn
 }, { status: 200 });
 }

 } catch (error: any) {
 logger.error('Error processing attendance:', error);
 return NextResponse.json(
 { error: 'Failed to process attendance' },
 { status: 500 }
 );
 }
}
