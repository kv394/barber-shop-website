import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BookingPageClient from './BookingPageClient';
import { serialize } from '@/lib/serialize';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ renterId: string }> }): Promise<Metadata> {
 const { renterId } = await params;
 const renter = await prisma.user.findUnique({
 where: { id: renterId, role: 'BOOTH_RENTER' },
 select: { name: true, shop: { select: { name: true } } },
 });
 if (!renter) return { title: 'Book an Appointment' };
 return {
 title: `Book with ${renter.name || 'Stylist'} | ${renter.shop?.name || 'KutzApp'}`,
 description: `Book your appointment directly with ${renter.name || 'your stylist'} — pick a service, choose your time, and pay securely online.`,
 };
}

export default async function BookPage({ params }: { params: Promise<{ renterId: string }> }) {
 const { renterId } = await params;

 const renter = await prisma.user.findUnique({
 where: { id: renterId, role: 'BOOTH_RENTER' },
 select: {
 id: true, name: true, imageUrl: true,
 stripeConnectOnboarded: true,
 shop: { select: { id: true, name: true, currency: true } },
 portfolioImages: { select: { imageUrl: true }, take: 1, orderBy: { createdAt: 'desc' } },
 },
 });

 if (!renter) notFound();

 const services = await prisma.renterService.findMany({
 where: { userId: renterId, isActive: true },
 orderBy: { price: 'asc' },
 });

 return (
 <BookingPageClient
 renter={serialize(renter)}
 services={serialize(services)}
 />
 );
}
