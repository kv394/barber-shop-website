import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { createTerminalConnectionToken } from '@/lib/stripe';
import { logger } from '@/lib/logger';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    
    if (!authUserSession?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findFirst({ 
      where: { OR: [{ id: authUserSession.id }, { email: authUserSession.email || '' }] } 
    });
    
    const canManage = user?.role === 'SITE_ADMIN' || 
                     (user?.role === 'SHOP_ADMIN' && user?.shopId === shopId) ||
                     (user?.role === 'STAFF' && user?.shopId === shopId);

    if (!canManage) {
      return new Response('Forbidden', { status: 403 });
    }

    // Call Stripe to create a terminal connection token
    const token = await createTerminalConnectionToken();
    
    return NextResponse.json({ secret: token });
  } catch (error) {
    logger.error('Failed to create terminal connection token', error);
    return NextResponse.json({ error: 'Failed to create connection token' }, { status: 500 });
  }
}
