import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canView = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId);
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
      where: { shopId: params.shopId, ...dateFilter },
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
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canCreate = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId);
    if (!canCreate) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { amount, category, description, date } = body;

    if (!amount || !category) {
      return NextResponse.json({ error: 'Amount and category are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        category,
        description: description || null,
        date: date ? new Date(date) : new Date(),
        shopId: params.shopId,
      },
    });

    revalidatePath(`/shop/${params.shopId}/expenses`);
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    logger.error('Error creating expense:', error);
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { shopId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const canDelete = user?.role === 'SUPER_ADMIN' ||
      (user?.role === 'SHOP_ADMIN' && user?.shopId === params.shopId);
    if (!canDelete) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');
    if (!expenseId) return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });

    await prisma.expense.delete({ where: { id: expenseId } });
    revalidatePath(`/shop/${params.shopId}/expenses`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error deleting expense:', error);
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
  }
}

