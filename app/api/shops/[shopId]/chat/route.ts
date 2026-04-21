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
    if (!user || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
        return new Response('Forbidden', { status: 403 });
    }

    // Only SHOP_ADMIN, STAFF and SITE_ADMIN can view team chat
    if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF' && user.role !== 'SITE_ADMIN') {
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
    if (!user || (user.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
        return new Response('Forbidden', { status: 403 });
    }

    if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF' && user.role !== 'SITE_ADMIN') {
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
            role: { in: ['STAFF', 'SHOP_ADMIN', 'SITE_ADMIN'] } 
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
      
      // Handle @help AI Assistant
      if (mentions.includes('help') && process.env.GEMINI_API_KEY) {
        const question = message.content.replace(/@help/gi, '').trim() || "What can you help me with?";
        const systemInstruction = `You are a helpful expert AI assistant for this specific barbershop/salon management platform.
Your job is to answer questions about how to use the site's functionality based ONLY on the exact layout provided below. 

SITE NAVIGATION MAP:
- **Dashboard:** Main landing page for the shop, showing today's stats, active time logs, and low stock alerts.
- **Bookings:** A full calendar interface to view and manage appointments.
- **Waitlist:** Manage clients waiting for an opening.
- **Clients:** Client database, history, formulas, and gallery.
- **Team:** For Shop Admins, this sidebar link goes to a page with two horizontal tabs: "Team & Availability" (to manage staff, set working hours, invite users) and "Portfolio" (to manage all staff portfolio images).
- **Engagement:** Contains sub-tabs for Analytics, Loyalty programs, Referrals, Marketing Campaigns, Gift Cards, and Reviews.
- **Reports:** Contains sub-tabs for Sales & Insights, Commissions, Staff Working Hours, and Expenses.
- **Configuration (Config):** Contains sub-tabs for Services, Add-ons, and Products (Inventory).
- **Settings:** Contains sub-tabs for Shop Details, Booking Rules, Resources (Chairs/Stations), Intake Forms, Memberships, Kiosk Settings, Notifications, and Billing.

For non-admin staff ("My Area" in the sidebar):
- **My Schedule:** Where staff can view their own appointments.
- **My Leave:** Where staff can request time off.
- **My Portfolio:** Where staff can manage their own public portfolio images.
- **My Earnings:** Where staff can see their commission reports.
- **Profile:** Basic user profile settings.

INSTRUCTIONS:
1. When asked how to do something, point them to the exact menu path listed above. Pay special attention to their role (if implied).
2. Keep your answers concise, friendly, and formatted with markdown.
3. If a Shop Admin asks about portfolio images, tell them to click "Team" in the sidebar and then click the "Portfolio" tab. If a Staff member asks, tell them to click "My Portfolio" under "My Area" in the sidebar.
4. If they ask about "staff availability", tell them to click "Team" in the sidebar and use the "Team & Availability" tab.
5. If they ask about transferring or sharing staff between locations, explain that they should use the Location Dropdown at the top left to switch to the *new* location, go to the "Team" menu, and invite the staff member using their existing email address. To completely transfer them, they can then switch to the *old* location and click "Remove from Shop" on that staff member's card.`;

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: [{ parts: [{ text: question }] }],
              generationConfig: { temperature: 0.7 }
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure how to help with that right now.";
            
            const aiUser = await prisma.user.upsert({
              where: { email: 'ai-assistant@system.local' },
              update: {},
              create: {
                id: 'system_ai_assistant',
                email: 'ai-assistant@system.local',
                name: 'AI Assistant',
                role: 'SITE_ADMIN',
              }
            });

            await prisma.message.create({
              data: {
                shopId,
                senderId: aiUser.id,
                content: answer,
              }
            });
          } else {
             logger.error("AI Assistant error response:", await response.text());
          }
        } catch (aiError) {
          logger.error("Error triggering AI assistant:", aiError);
        }
      }
    }

    return NextResponse.json(message);
  } catch (error: any) {
    logger.error("Error sending message:", error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
