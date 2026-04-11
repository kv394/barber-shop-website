import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    let userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || user.shopId !== shopId) {
        return new Response('Forbidden', { status: 403 });
    }

    // Only SHOP_ADMIN, STAFF and SUPER_ADMIN can view team chat
    if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN') {
        return new Response('Forbidden', { status: 403 });
    }

    const messages = await prisma.message.findMany({
      where: { shopId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' },
      take: 100 // Get latest 100 messages
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    logger.error("Error fetching messages:", error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const supabase = await createClient();
    const { data: { user: authUserSession } } = await supabase.auth.getUser();
    let userId = authUserSession?.id;
    const authUserEmail = authUserSession?.email;
    if (!userId) return new Response('Unauthorized', { status: 401 });

    const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
    if (!user || user.shopId !== shopId) {
        return new Response('Forbidden', { status: 403 });
    }

    if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF' && user.role !== 'SUPER_ADMIN') {
        return new Response('Forbidden', { status: 403 });
    }

    const body = await request.json();
    
    if ((!body.content || body.content.trim() === '') && !body.imageUrl) {
        return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        shopId,
        senderId: user.id,
        content: body.content ? body.content.trim() : '',
        imageUrl: body.imageUrl ? body.imageUrl.trim() : null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true
          }
        }
      }
    });

    // Handle @ mentions for notifications
    if (message.content) {
      const mentionRegex = /@(\w+)/g;
      const mentions = Array.from(message.content.matchAll(mentionRegex)).map(m => m[1].toLowerCase());
      
      if (mentions.length > 0) {
        // Find users in the shop whose first name matches the mentions
        const shopUsers = await prisma.user.findMany({
          where: { 
            shopId,
            role: { in: ['STAFF', 'SHOP_ADMIN', 'SUPER_ADMIN'] } 
          }
        });

        const mentionedUsers = shopUsers.filter(u => {
          if (!u.name) return false;
          const firstName = u.name.split(' ')[0].toLowerCase();
          return mentions.includes(firstName);
        });

        // Create a notification for each mentioned user
        const notifications = mentionedUsers.filter(u => u.id !== user.id).map(u => ({
          shopId,
          userId: u.id,
          type: 'CHAT_MENTION',
          title: 'New Mention',
          message: `${user.name || 'A team member'} mentioned you in the chat: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
          status: 'PENDING'
        }));

        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });
        }
      }
    }

    return NextResponse.json(message);
  } catch (error: any) {
    logger.error("Error sending message:", error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
