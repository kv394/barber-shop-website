import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
 return new NextResponse(null, {
 headers: {
 'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Methods': 'GET, OPTIONS',
 },
 });
}

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const { searchParams } = new URL(request.url);
 const dateStr = searchParams.get('date');

 const headers = {
 'Access-Control-Allow-Origin': '*',
 'Access-Control-Allow-Methods': 'GET, OPTIONS',
 };

 if (!dateStr) {
 // SECURITY: Require authentication to fetch sensitive staff details
 const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Return all staff if no date is provided (for admin/settings use cases)
 const allStaff = await tenantClient.user.findMany({
 where: {
 OR: [
 { shopId: shopId, role: 'STAFF' },
 { shopAccesses: { some: { shopId: shopId, role: 'STAFF' } } }
 ]
 },
 select: {
 id: true,
 name: true,
 role: true,
 email: true,
 commissionRateService: true,
 commissionRateProduct: true,
 workingHours: true,
 },
 });
 return NextResponse.json({ staff: allStaff }, { headers });
 }

 const targetDate = new Date(dateStr);
 // SECURITY: Validate the date is a real date
 if (isNaN(targetDate.getTime())) {
 return NextResponse.json({ error: 'Invalid date format' }, { status: 400, headers });
 }

 const staffWithLeave = await tenantClient.user.findMany({
 where: {
 OR: [
 { shopId: shopId, role: 'STAFF' },
 { shopAccesses: { some: { shopId: shopId, role: 'STAFF' } } }
 ]
 },
 select: {
 id: true,
 name: true,
 role: true,
 workingHours: true,
 leaves: {
 where: {
 date: {
 equals: targetDate,
 },
 },
 select: { id: true },
 },
 },
 });

 // Filter out staff who have leave on the selected date
 const availableStaff = staffWithLeave.filter((staff: any) => staff.leaves.length === 0);

 // SECURITY: Only return minimal public data — no emails, phone, or internal fields
 const staffToReturn = availableStaff.map((s: any) => ({
 id: s.id, 
 name: s.name || 'Staff Member',
 workingHours: s.workingHours
 }));

 return NextResponse.json(staffToReturn);
 } catch (error) {
 logger.error("Error fetching staff availability:", error);
 return NextResponse.json({ error: 'Failed to fetch staff availability' }, { status: 500 });
 }
}
