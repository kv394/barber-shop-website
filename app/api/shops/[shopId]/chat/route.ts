import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminToolDeclarations, executeAdminTool } from '@/lib/ai-admin-tools';
import { GoogleGenAI } from '@google/genai';

const isDatabaseConnectionError = (error: any) => {
 const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);
 const code = error?.code?.toString?.();
 return /connection terminated due to connection timeout|connection terminated unexpectedly|connection timeout|connection refused|ECONNRESET|ETIMEDOUT|ECONNREFUSED|EMAXCONNSESSION|max clients reached|session mode/i.test(msg + ' ' + code);
};

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: authUser } } = await supabase.auth.getUser();
 if (!authUser) return new Response('Unauthorized', { status: 401 });
 const userId = authUser.id;
 const authUserEmail = authUser.email;

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 // Only SHOP_ADMIN, STAFF and SITE_ADMIN can view team chat
 if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF') {
 return new Response('Forbidden', { status: 403 });
 }

 const { searchParams } = new URL(request.url);
 const cursor = searchParams.get('cursor');
 const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 100);

 const messages = await tenantClient.message.findMany({
 where: { shopId },
  include: {
  sender: {
  select: {
  id: true,
  name: true,
  role: true
  }
  },
  parent: {
  select: {
  id: true,
  content: true,
  sender: { select: { name: true } }
  }
  },
  receipts: {
  include: {
  user: { select: { name: true, id: true } }
  }
  }
  },
 orderBy: { createdAt: 'desc' },
 take: limit + 1,
 ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
 });

 let nextCursor: string | null = null;
 if (messages.length > limit) {
  messages.pop();
  nextCursor = messages[messages.length - 1].id;
 }

 // Reverse so messages are in chronological order (oldest first)
 messages.reverse();

 return NextResponse.json({ messages, nextCursor });
 } catch (error: any) {
 const { shopId } = await params;
 logger.error("Error fetching messages:", error, { path: `/api/shops/${shopId}/chat`, shopId });
 if (isDatabaseConnectionError(error)) {
 return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
 }
 return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
 }
}

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { user: authUser } } = await supabase.auth.getUser();
 if (!authUser) return new Response('Unauthorized', { status: 401 });
 const userId = authUser.id;
 const authUserEmail = authUser.email;

 const user = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!user || (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {
 return new Response('Forbidden', { status: 403 });
 }

 if (user.role !== 'SHOP_ADMIN' && user.role !== 'STAFF') {
 return new Response('Forbidden', { status: 403 });
 }

 const body = await request.json();
 
 if ((!body.content || body.content.trim() === '') && !body.imageUrl) {
 return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
 }

 const message = await tenantClient.message.create({
 data: {
 shopId,
 senderId: user.id,
 content: body.content ? body.content.trim() : '',
 imageUrl: body.imageUrl ? body.imageUrl.trim() : null,
 parentId: body.parentId || null,
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
 const mentions = Array.from(message.content.matchAll(mentionRegex)).map((m: any) => m[1].toLowerCase());
 
 if (mentions.length > 0) {
 // Find users in the shop whose first name matches the mentions
 const shopUsers = await tenantClient.user.findMany({
 where: { 
 shopId,
 role: { in: ['STAFF', 'SHOP_ADMIN'] } 
 }
 });

 const mentionedUsers = shopUsers.filter((u: any) => {
 if (!u.name) return false;
 const firstName = u.name.split(' ')[0].toLowerCase();
 return mentions.includes(firstName);
 });

 // Create a notification for each mentioned user
 const notifications = mentionedUsers.filter((u: any) => u.id !== user.id).map((u: any) => ({
 shopId,
 userId: u.id,
 type: 'CHAT_MENTION',
 title: 'New Mention',
 message: `${user.name || 'A team member'} mentioned you in the chat: "${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}"`,
 status: 'PENDING'
 }));

 if (notifications.length > 0) {
 await tenantClient.notification.createMany({ data: notifications });
 }
 }
 
 // Handle @help AI Assistant
 if (mentions.includes('help')) {
 const question = message.content.replace(/@help/gi, '').trim() || "What can you help me with?";
 
 try {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

 // ─── Load rich shop context for the AI ───────────────────
 const [shop, services, staffList, todayAppointments, recentBookings, productCount, clientCount] = await Promise.all([
 tenantClient.shop.findUnique({
 where: { id: shopId },
 select: { name: true, timezone: true, customization: true, depositRequired: true, depositAmount: true },
 }),
 tenantClient.service.findMany({ where: { shopId, type: 'CUSTOMER' }, select: { name: true, price: true, duration: true } }),
 tenantClient.user.findMany({ where: { shopId, role: { in: ['STAFF', 'SHOP_ADMIN'] } }, select: { name: true, role: true } }),
 tenantClient.appointment.findMany({
 where: {
 shopId,
 startTime: { gte: new Date(new Date().setHours(0,0,0,0)), lt: new Date(new Date().setHours(23,59,59,999)) },
 status: { notIn: ['CANCELLED'] },
 },
 include: { staff: { select: { name: true } }, user: { select: { name: true } }, service: { select: { name: true } } },
 orderBy: { startTime: 'asc' },
 }),
 tenantClient.appointment.count({ where: { shopId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
 tenantClient.product.count({ where: { shopId } }),
 tenantClient.user.count({ where: { shopId, role: 'CLIENT' } }),
 ]);

 const shopTz = shop?.timezone || 'America/Chicago';
 const nowInShopTz = new Intl.DateTimeFormat('en-US', {
 timeZone: shopTz,
 weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
 hour: '2-digit', minute: '2-digit', hour12: true,
 }).format(new Date());

 const todayDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: shopTz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

 const servicesText = services.length > 0
 ? services.map((s: any) => `  - ${s.name}: $${s.price} (${s.duration} min)`).join('\n')
 : '  No services configured yet.';

 const staffText = staffList.length > 0
 ? staffList.map((s: any) => `  - ${s.name || 'Unnamed'} (${s.role})`).join('\n')
 : '  No staff configured yet.';

 const todayScheduleText = todayAppointments.length > 0
 ? todayAppointments.map((a: any) => {
 const time = new Intl.DateTimeFormat('en-US', { timeZone: shopTz, hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(a.startTime));
 return `  - ${time}: ${a.service?.name || 'Service'} with ${a.staff?.name || 'Staff'} → Client: ${a.user?.name || 'Walk-in'} [${a.status}]`;
 }).join('\n')
 : '  No appointments scheduled for today.';

 const c = (shop?.customization as any) || {};
 const businessHours = (() => {
 const bh = c.businessHours || {};
 const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
 return days.map(d => {
 const day = bh[d];
 if (!day) return `  ${d.charAt(0).toUpperCase() + d.slice(1)}: CLOSED`;
 return `  ${d.charAt(0).toUpperCase() + d.slice(1)}: ${day.open || '9:00'} – ${day.close || '17:00'}`;
 }).join('\n');
 })();

 const systemInstruction = `You are an expert AI assistant for "${shop?.name || 'this shop'}", a barbershop/salon management platform powered by KutzApp.

CURRENT DATE & TIME:
- Right now it is: ${nowInShopTz}
- Today's date (YYYY-MM-DD): ${todayDateStr}
- Shop timezone: ${shopTz}
- IMPORTANT: You MUST answer date/time questions directly. If the user asks "what is today's date" or "what day is it", respond with the exact date and time above.

THE USER:
- Name: ${user.name || 'Unknown'}
- Role: ${user.role} (${user.role === 'SHOP_ADMIN' ? 'Full admin access — can modify services, staff, settings' : 'Staff member — read-only, can view schedule and info'})

SHOP OVERVIEW:
- Shop Name: ${shop?.name || 'Unknown'}
- Deposit: ${shop?.depositRequired ? '$' + shop.depositAmount + ' required' : 'Not required'}
- Total Clients: ${clientCount}
- Total Products: ${productCount}
- Bookings This Week: ${recentBookings}

BUSINESS HOURS:
${businessHours}

SERVICES:
${servicesText}

STAFF:
${staffText}

TODAY'S SCHEDULE (${todayDateStr}):
${todayScheduleText}
- Total appointments today: ${todayAppointments.length}

YOUR CAPABILITIES:
1. Answer ANY question about the shop AND the KutzApp platform — features, how-to, best practices
2. Look up shop data using your tools (get_shop_context, get_staff_schedule)
3. Get business intelligence using the get_business_insights tool (revenue, no-show rate, health score)
4. Check client engagement with the get_client_engagement tool (find inactive clients, win-back campaigns)
5. Modify shop data IF the user is SHOP_ADMIN: add/edit/delete services, products, add-ons, staff, blackout dates, settings
6. NEVER say "I'm not familiar with" or "I don't know about" any KutzApp feature — you know ALL features listed below
7. Be concise but helpful — this is a team chat, not a formal document
8. If asked to do something you can't do via tools, tell them which page in the admin dashboard has that feature

KUTZAPP PLATFORM FEATURES (you MUST reference these when answering feature questions):

📅 BOOKING & SCHEDULING:
- Online booking widget for clients (embeddable on any website)
- Walk-in queue management
- Recurring/repeat appointment scheduling
- Appointment reminders via SMS and email (automated)
- Buffer time between appointments (configurable per service)
- Multi-staff calendar with drag-and-drop rescheduling
- Blackout dates for holidays/closures
- Resource management (chairs, stations, rooms) to prevent double-booking

💰 DYNAMIC PRICING:
- Peak hour pricing — automatically charge more during busy times (configurable in Settings > Booking & Hours)
- Weekend/holiday surcharges
- Service-level pricing tiers
- Custom pricing rules based on staff seniority
- Deposit requirements (configurable amount, can be set per-service or shop-wide)

💇 SERVICES & ADD-ONS:
- Unlimited services with name, price, duration, description
- Service categories and ordering
- Add-ons (e.g., beard oil, hot towel) that clients can add during booking
- Service-specific staff assignment
- Break services (for staff lunch/breaks, not visible to clients)

👥 CLIENT MANAGEMENT (CRM):
- Full client profiles with visit history, spend, and notes
- Client tags and segments (VIP, new, inactive, etc.)
- Loyalty points system — clients earn points per visit/spend
- Client-specific notes and preferences
- Birthday tracking with automated birthday campaigns
- Client feedback/review collection after each visit

🏆 GAMIFICATION:
- Staff leaderboards (revenue, bookings, tips, reviews)
- Achievement badges for staff milestones
- Point-based reward system for staff performance
- Client-facing loyalty tiers (Bronze, Silver, Gold, Platinum)
- Referral tracking and rewards

📊 REPORTS & ANALYTICS:
- Revenue reports (daily, weekly, monthly, custom range)
- Staff performance breakdown
- Service popularity analysis
- No-show tracking and rates
- Tip reports by staff
- AI-powered business insights (via BI Agent — use get_business_insights tool)
- CSV export for all reports
- Client retention metrics

📣 MARKETING & CAMPAIGNS:
- AI-generated campaign copy (SMS, Email, or both)
- Client segmentation for targeted campaigns (inactive 30/60/90 days, birthdays, all)
- Win-back campaigns for inactive clients (automated via Engagement Agent)
- Social media caption generator with AI (analyzes portfolio images)
- Campaign performance tracking
- Bulk SMS/Email sending

⭐ REVIEWS & REPUTATION:
- Automated review request after appointments
- Review display on shop's public page
- Google review integration prompt
- Review response management
- Star rating analytics

🎨 SHOP CUSTOMIZATION:
- Custom landing page with branding (colors, logo, fonts, images)
- Custom booking page URL
- Service menu display on public page
- Photo gallery/portfolio for showcasing work
- Testimonials section
- Team/staff bios on public page
- SEO optimization for local search

💬 TEAM CHAT (this feature!):
- Real-time team messaging
- @mention notifications for specific team members
- @help AI assistant (that's you!) for instant answers and admin actions
- Image sharing in chat
- Read receipts
- Message threading/replies

📦 INVENTORY & PRODUCTS:
- Product catalog management
- Inventory tracking with stock counts
- Low-stock alerts
- Product sales tracking
- Retail product display on booking page

⚙️ SETTINGS & ADMIN:
- Business hours configuration (per day, open/close times)
- Timezone management
- Staff roles and permissions (SHOP_ADMIN vs STAFF)
- Multi-location support (Shop Access for staff across locations)
- Notification preferences
- AI token management (each AI feature uses tokens)
- Webhook integrations
- API access for third-party integrations

📱 CLIENT-FACING FEATURES:
- Mobile-optimized booking page
- Client self-service (view/cancel/reschedule appointments)
- Waitlist for fully-booked time slots
- Client portal with appointment history
- Push notifications for appointment reminders

RESPONSE STYLE:
- Keep answers short and actionable (this is a chat, not an email)
- Use emoji sparingly for visual clarity
- Format lists with bullet points or numbers
- If you perform an action with a tool, confirm what you did clearly
- When explaining features, tell them WHERE to find it in the dashboard (e.g., "Go to Settings > Booking & Hours")`;

  const genaiTools = [{ functionDeclarations: adminToolDeclarations.map((d: any) => ({
    name: d.name,
    description: d.description,
    parameters: d.parameters,
  })) }];

  // Load recent chat history for context (last 20 messages)
  const recentMessages = await tenantClient.message.findMany({
    where: { shopId },
    include: { sender: { select: { name: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  
  // Build conversation history (chronological order)
  const chatHistory = recentMessages.reverse().map((m: any) => {
    const senderName = m.sender?.name || 'Unknown';
    const isAi = m.sender?.name === 'AI Assistant';
    return {
      role: isAi ? 'model' as const : 'user' as const,
      parts: [{ text: isAi ? m.content : `[${senderName}]: ${m.content}` }]
    };
  });

  // Add the current question at the end
  let formattedContents: any[] = [
    ...chatHistory,
    { role: 'user', parts: [{ text: `[${user.name || 'Admin'}]: ${question}` }] }
  ];

  let response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: formattedContents,
    config: {
      temperature: 0.7,
      systemInstruction: systemInstruction,
      tools: genaiTools,
    }
  });

 let finalResponseText = "";
 let functionCalls: any[] = [];
 
 const extractParts = (res: any) => {
   let text = "";
   let fc = [];
   const parts = res.candidates?.[0]?.content?.parts || [];
   for (const part of parts) {
     if (part.text && !part.thought) text += part.text;
     if (part.functionCall) fc.push(part.functionCall);
   }
   return { text, fc };
 };

  let extracted = extractParts(response);
  finalResponseText += extracted.text;
  functionCalls = extracted.fc;

  let loopCount = 0;
  let totalTokensUsed = response.usageMetadata?.totalTokenCount || 0;

  while (functionCalls && functionCalls.length > 0 && loopCount < 5) {
    loopCount++;
    const toolResponses: any[] = [];

    for (const call of functionCalls) {
      let result: any = {};
      try {
        result = await executeAdminTool(call, shopId, user);
      } catch (err: any) {
        result = { error: 'Internal Server Error' };
      }
      toolResponses.push({ functionResponse: { name: call.name, response: result } });
    }

    const lastParts = response.candidates?.[0]?.content?.parts || [];
    formattedContents.push({ role: 'model', parts: lastParts });
    formattedContents.push({ role: 'user', parts: toolResponses });

    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: formattedContents,
      config: {
        temperature: 0.7,
        systemInstruction: systemInstruction,
        tools: genaiTools,
      }
    });
    
    totalTokensUsed += response.usageMetadata?.totalTokenCount || 0;

    extracted = extractParts(response);
    finalResponseText += extracted.text;
    functionCalls = extracted.fc;
  }

 if (totalTokensUsed > 0) {
 await tenantClient.shop.update({
 where: { id: shopId },
 data: { aiTokens: { decrement: totalTokensUsed } }
 });
 }
 
 const aiUser = await tenantClient.user.upsert({
 where: { email: 'ai-assistant@system.local' },
 update: {},
 create: {
 id: 'system_ai_assistant',
 email: 'ai-assistant@system.local',
 name: 'AI Assistant',
 role: 'CLIENT',
 }
 });

 await tenantClient.message.create({
 data: {
 shopId,
 senderId: aiUser.id,
 content: finalResponseText || "I have completed the task.",
 }
 });
 } catch (aiError) {
 logger.error("Error triggering AI assistant:", aiError);
 // Post a visible error message so the user knows the AI failed
 try {
 const aiUser = await tenantClient.user.upsert({
 where: { email: 'ai-assistant@system.local' },
 update: {},
 create: { id: 'system_ai_assistant', email: 'ai-assistant@system.local', name: 'AI Assistant', role: 'CLIENT' }
 });
 await tenantClient.message.create({
 data: { shopId, senderId: aiUser.id, content: '⚠️ Sorry, I encountered an error processing your request. Please try again in a moment.' }
 });
 } catch (_) { /* silently fail if even the error message fails */ }
 }
 }
 }

 return NextResponse.json(message);
 } catch (error: any) {
 const { shopId } = await params;
 logger.error("Error sending message:", error, { path: `/api/shops/${shopId}/chat`, shopId });
 if (isDatabaseConnectionError(error)) {
 return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
 }
 return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
 }
}
