import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
 try {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user || !user.email) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 const dbUser = await prisma.user.findFirst({
 where: { OR: [{ id: user.id }, { email: user.email }] },
 select: {
 id: true,
 email: true,
 name: true,
 role: true,
 shopId: true,
 phone: true,
 image: true,
 barcode: true,
 createdAt: true,
 shop: {
 select: {
 id: true,
 name: true,
 }
 }
 }
 });

 if (!dbUser) {
 return NextResponse.json({ error: 'User not found' }, { status: 404 });
 }

 return NextResponse.json(dbUser);
 } catch (error) {
 console.error('Error fetching user:', error);
 return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
 }
}
