import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string, staffId: string }> }
) {
 try {
 const { shopId, staffId } = await params;

 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

 const shop = await prisma.shop.findUnique({ where: { id: shopId } });
 if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

 const staffMember = await prisma.user.findUnique({
 where: { id: staffId, shopId: shopId },
 select: {
 id: true,
 email: true,
 name: true,
 role: true,
 phone: true,
 image: true,
 shopId: true,
 barcode: true,
 commissionRate: true,
 isAvailable: true,
 workingDays: true,
 workingHoursStart: true,
 workingHoursEnd: true,
 createdAt: true,
 leaves: { where: { date: { gte: new Date() } }, orderBy: { date: 'asc' } },
 },
 });
 if (!staffMember) return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });

 return NextResponse.json({
 shop: JSON.parse(JSON.stringify(shop)),
 userRole: authResult.user.role,
 staffMember: JSON.parse(JSON.stringify(staffMember)),
 });
 } catch (error) {
 logger.error('Error fetching staff member:', error);
 return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
 }
}

export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ shopId: string, staffId: string }> }
) {
 try {
 const { shopId, staffId } = await params;

 // Only SHOP_ADMIN or SITE_ADMIN can modify staff profiles
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Verify the target staff member belongs to this shop
 const target = await prisma.user.findUnique({ where: { id: staffId } });
 if (!target || (target.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: target.id, shopId } })))) {
 return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
 }

 const body = await request.json();
 const allowedFields: Record<string, any> = {};
 if (body.commissionRateService !== undefined) allowedFields.commissionRateService = body.commissionRateService;
 if (body.commissionRateProduct !== undefined) allowedFields.commissionRateProduct = body.commissionRateProduct;
 if (body.workingHours !== undefined) allowedFields.workingHours = body.workingHours;
 if (body.name !== undefined) allowedFields.name = body.name;
 if (body.phone !== undefined) allowedFields.phone = body.phone;
 if (body.canManageInventory !== undefined) allowedFields.canManageInventory = body.canManageInventory;
 if (body.imageUrl !== undefined) allowedFields.imageUrl = body.imageUrl;
 if (body.employmentType !== undefined) allowedFields.employmentType = body.employmentType;
 if (body.boothRentAmount !== undefined) allowedFields.boothRentAmount = body.boothRentAmount;
 if (body.boothRentInterval !== undefined) allowedFields.boothRentInterval = body.boothRentInterval;
 if (body.stripeConnectAccountId !== undefined) allowedFields.stripeConnectAccountId = body.stripeConnectAccountId;

 const updated = await prisma.user.update({ where: { id: staffId }, data: allowedFields });
 const { googleRefreshToken, recoveryTotpSecret, ...safeUser } = updated as any;
 return NextResponse.json(JSON.parse(JSON.stringify(safeUser)));
 } catch (error) {
 logger.error('Error updating staff member:', error);
 return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
 }
}
