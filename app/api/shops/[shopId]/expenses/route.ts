import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { expenseSchema } from '@/lib/validations';
export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canView = user?.role === 'SITE_ADMIN' ||
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
 if (!canView) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

 const { searchParams } = new URL(request.url);
 const month = searchParams.get('month'); // YYYY-MM format

 let dateFilter = {};
 if (month) {
 const [y, m] = month.split('-').map(Number);
 const start = new Date(y, m - 1, 1);
 const end = new Date(y, m, 1);
 dateFilter = { date: { gte: start, lt: end } };
 }

 const expenses = await prisma.expense.findMany({
 where: { shopId: shopId, ...dateFilter },
 orderBy: { date: 'desc' },
 });

 return NextResponse.json(expenses);
 } catch (error) {
 logger.error('Error fetching expenses:', error);
 return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canCreate = user?.role === 'SITE_ADMIN' ||
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
 if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const validationResult = expenseSchema.safeParse(body);
  if (!validationResult.success) {
    return NextResponse.json({ error: 'Invalid input data', details: validationResult.error.format() }, { status: 400 });
  }

  const { amount: parsedAmount, category, description, date } = validationResult.data;

  const expense = await prisma.expense.create({
    data: {
      amount: parsedAmount,
      category: String(category).replace(/<[^>]*>/g, '').slice(0, 100),
      description: description ? String(description).replace(/<[^>]*>/g, '').slice(0, 1000) : null,
      date: date ? new Date(date) : new Date(),
 shopId: shopId,
 },
 });

 revalidatePath(`/shop/${shopId}/expenses`);
 return NextResponse.json(expense, { status: 201 });
 } catch (error) {
 logger.error('Error creating expense:', error);
 return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
 }
}

export async function DELETE(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

 const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 const canDelete = user?.role === 'SITE_ADMIN' ||
 (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId);
 if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

 const { searchParams } = new URL(request.url);
 const expenseId = searchParams.get('id');
 if (!expenseId) return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });

 // Verify expense belongs to this shop (prevent cross-shop deletion)
 const expense = await prisma.expense.findUnique({ where: { id: expenseId } });
 if (!expense || (expense.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: expense.id, shopId } })))) {
 return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
 }

 await prisma.expense.delete({ where: { id: expenseId } });
 revalidatePath(`/shop/${shopId}/expenses`);
 return NextResponse.json({ success: true });
 } catch (error) {
 logger.error('Error deleting expense:', error);
 return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
 }
}

