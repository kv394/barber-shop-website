import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const logs = await prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    return NextResponse.json(logs);
  } catch (e: any) {
    return NextResponse.json({ error: e.message });
  }
}