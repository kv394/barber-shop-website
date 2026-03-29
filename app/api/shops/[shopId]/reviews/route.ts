import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: { shopId: params.shopId },
      include: {
        user: { select: { name: true } },
        appointment: { include: { service: { select: { name: true } }, staff: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(reviews);
  } catch (error) {
    logger.error('Error fetching reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { appointmentId, rating, comment } = body;

    if (!appointmentId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid appointmentId and rating (1-5) required' }, { status: 400 });
    }

    // Verify the appointment belongs to this user and shop
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.shopId !== params.shopId || appointment.userId !== userId) {
      return NextResponse.json({ error: 'Appointment not found or not yours' }, { status: 404 });
    }

    if (appointment.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed appointments' }, { status: 400 });
    }

    // Check for existing review
    const existing = await prisma.review.findUnique({ where: { appointmentId } });
    if (existing) {
      return NextResponse.json({ error: 'Already reviewed' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment || null,
        appointmentId,
        userId,
        shopId: params.shopId,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Error creating review:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}

