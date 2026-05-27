import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
 try {
 await prisma.saaSTier.upsert({
 where: { name: 'Solo Pro' },
 update: {
 baseFeeUSD: 19.99,
 maxAppointments: 9999999, // unlimited
 maxUsers: 1,
 maxFormSubmissions: 9999999,
 storageLimitMB: 5000, // generous for a solo
 description: 'Zero transaction fees. Perfect for independent booth renters and solo operators.',
 },
 create: {
 name: 'Solo Pro',
 baseFeeUSD: 19.99,
 maxAppointments: 9999999,
 maxUsers: 1,
 maxFormSubmissions: 9999999,
 storageLimitMB: 5000,
 description: 'Zero transaction fees. Perfect for independent booth renters and solo operators.',
 }
 });
 return NextResponse.json({ success: true, message: 'Solo Pro tier created successfully!' });
 } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
}
