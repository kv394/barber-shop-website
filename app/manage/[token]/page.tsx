import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ManageBookingClient from './ManageBookingClient';

export const dynamic = 'force-dynamic';

export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
 const { token } = await params;

 const appointment = await prisma.appointment.findUnique({
 where: { managementToken: token },
 include: {
 shop: { select: { id: true, name: true, currency: true } },
 staff: { select: { name: true, imageUrl: true, id: true } },
 service: { select: { name: true, price: true, duration: true } },
 },
 });

 if (!appointment) notFound();

 // If the appointment belongs to a booth renter, they might be using RenterService instead of Shop Service
 let serviceName = appointment.service?.name;
 let servicePrice = appointment.service?.price;
 let serviceDuration = appointment.service?.duration;

 // We don't have RenterService linked directly to appointment in schema, so if service is null, we just show a generic name.
 if (!serviceName) {
 serviceName = 'Haircut Appointment';
 }

 const isPast = new Date(appointment.startTime) < new Date();

 return (
 <div className="min-h-screen bg-gradient-to-br from-[#0f0c09] via-[#1a1410] to-[#0a0806] text-white flex justify-center py-12 px-4">
 <ManageBookingClient 
 appointment={JSON.parse(JSON.stringify({ ...appointment, serviceName, servicePrice, serviceDuration }))}
 isPast={isPast}
 />
 </div>
 );
}
