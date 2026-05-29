import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

// GET — public, returns a renter's active services
export async function GET(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const services = await prisma.renterService.findMany({
 where: { userId: renterId, isActive: true },
 orderBy: { createdAt: 'asc' },
 });
 return NextResponse.json(JSON.parse(JSON.stringify(services)));
 } catch (error) {
 logger.error('Error fetching renter services:', error);
 return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
 }
}

// POST — authenticated (booth renter only), creates a service
export async function POST(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (!dbUser || dbUser.id !== renterId || dbUser.role !== 'BOOTH_RENTER') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 const { name, description, price, duration } = body;
 if (!name || price == null || !duration) {
 return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
 }

 const service = await prisma.renterService.create({
 data: {
 userId: renterId,
 shopId: dbUser.shopId!,
 name: String(name).slice(0, 100),
 description: description ? String(description).slice(0, 500) : null,
 price: parseFloat(price),
 duration: parseInt(duration),
 },
 });
 return NextResponse.json(JSON.parse(JSON.stringify(service)), { status: 201 });
 } catch (error) {
 logger.error('Error creating renter service:', error);
 return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
 }
}

// PATCH — update a service
export async function PATCH(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (!dbUser || dbUser.id !== renterId || dbUser.role !== 'BOOTH_RENTER') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 const { serviceId, name, description, price, duration, isActive } = body;
 if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

 const updated = await prisma.renterService.update({
 where: { id: serviceId, userId: renterId },
 data: {
 ...(name != null ? { name: String(name).slice(0, 100) } : {}),
 ...(description != null ? { description: String(description).slice(0, 500) } : {}),
 ...(price != null ? { price: parseFloat(price) } : {}),
 ...(duration != null ? { duration: parseInt(duration) } : {}),
 ...(isActive != null ? { isActive: Boolean(isActive) } : {}),
 },
 });
 return NextResponse.json(JSON.parse(JSON.stringify(updated)));
 } catch (error) {
 logger.error('Error updating renter service:', error);
 return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
 }
}

// DELETE — remove a service
export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ renterId: string }> }
) {
 try {
 const { renterId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (!dbUser || dbUser.id !== renterId || dbUser.role !== 'BOOTH_RENTER') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const serviceId = searchParams.get('serviceId');
 if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 });

 await prisma.renterService.delete({ where: { id: serviceId, userId: renterId } });
 return NextResponse.json({ success: true });
 } catch (error) {
 logger.error('Error deleting renter service:', error);
 return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 });
 }
}
