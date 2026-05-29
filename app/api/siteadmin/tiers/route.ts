import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const tiers = await prisma.saaSTier.findMany({
 orderBy: { baseFeeUSD: 'asc' }
 });

 return NextResponse.json(tiers);
 } catch (error) {
 console.error('Error fetching tiers:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function POST(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 
 const newTier = await prisma.saaSTier.create({
 data: {
 name: body.name,
 baseFeeUSD: parseFloat(body.baseFeeUSD),
 maxAppointments: parseInt(body.maxAppointments),
 maxUsers: parseInt(body.maxUsers),
 maxFormSubmissions: parseInt(body.maxFormSubmissions),
 storageLimitMB: parseFloat(body.storageLimitMB),
 overageFeePer100MB: parseFloat(body.overageFeePer100MB || '1'),
 description: body.description || ''
 }
 });

 return NextResponse.json(newTier);
 } catch (error) {
 console.error('Error creating tier:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function PATCH(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 
 const updatedTier = await prisma.saaSTier.update({
 where: { id: body.id },
 data: {
 name: body.name,
 baseFeeUSD: parseFloat(body.baseFeeUSD),
 maxAppointments: parseInt(body.maxAppointments),
 maxUsers: parseInt(body.maxUsers),
 maxFormSubmissions: parseInt(body.maxFormSubmissions),
 storageLimitMB: parseFloat(body.storageLimitMB),
 overageFeePer100MB: parseFloat(body.overageFeePer100MB || '1'),
 description: body.description || ''
 }
 });

 return NextResponse.json(updatedTier);
 } catch (error) {
 console.error('Error updating tier:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function DELETE(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const id = searchParams.get('id');

 if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

 await prisma.saaSTier.delete({
 where: { id }
 });

 return NextResponse.json({ success: true });
 } catch (error) {
 console.error('Error deleting tier:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
