import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const page = parseInt(searchParams.get('page') || '1');
 const limit = parseInt(searchParams.get('limit') || '50');
 const level = searchParams.get('level');
 const path = searchParams.get('path');
 
 const skip = (page - 1) * limit;

 const where: any = {};
 if (level) where.level = level;
 if (path) where.path = path;

 const [logs, total] = await Promise.all([
 prisma.systemLog.findMany({
 where,
 orderBy: { createdAt: 'desc' },
 skip,
 take: limit,
 }),
 prisma.systemLog.count({ where })
 ]);

 return NextResponse.json({
 logs,
 pagination: {
 total,
 pages: Math.ceil(total / limit),
 page,
 limit
 }
 });
 } catch (error) {
 console.error('Error fetching logs:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}

export async function DELETE(request: Request) {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const dbUser = await prisma.user.findUnique({ where: { email: user.email! } });
 if (dbUser?.role !== 'SITE_ADMIN') {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const id = searchParams.get('id');

 if (id) {
 await prisma.systemLog.delete({ where: { id } });
 } else {
 // Clear all logs older than 30 days
 const thirtyDaysAgo = new Date();
 thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
 
 await prisma.systemLog.deleteMany({
 where: {
 createdAt: {
 lt: thirtyDaysAgo
 }
 }
 });
 }

 return NextResponse.json({ success: true });
 } catch (error) {
 console.error('Error deleting logs:', error);
 return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
 }
}
