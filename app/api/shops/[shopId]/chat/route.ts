import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { adminToolDeclarations, executeAdminTool } from '@/lib/ai-admin-tools';

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
 if (mentions.includes('help') && process.env.GEMINI_API_KEY) {
 const question = message.content.replace(/@help/gi, '').trim() || "What can you help me with?";
 
 try {
 const { GoogleGenAI } = require('@google/genai');
 const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
1. Answer ANY question about the shop — dates, time, services, pricing, staff, schedule, hours, policies
2. Look up shop data using your tools (get_shop_context, get_staff_schedule)
3. Modify shop data IF the user is SHOP_ADMIN: add/edit/delete services, products, add-ons, staff, blackout dates, settings
4. NEVER say "I don't have that information" if the answer is in the context above
5. Be concise but helpful — this is a team chat, not a formal document
6. If asked to do something you can't do, suggest which page in the admin dashboard has that feature

RESPONSE STYLE:
- Keep answers short and actionable (this is a chat, not an email)
- Use emoji sparingly for visual clarity
- Format lists with bullet points or numbers
- If you perform an action with a tool, confirm what you did clearly`;

 const tools = [{ functionDeclarations: adminToolDeclarations }];
 
 let formattedContents: any[] = [{ role: 'user', parts: [{ text: question }] }];

 let response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: formattedContents,
 config: { systemInstruction, tools }
 });

 let finalResponseText = "";
 if (response.candidates?.[0]?.content?.parts) {
 for (const part of response.candidates[0].content.parts) {
 if (typeof part.text === 'string' && !part.thought) {
 finalResponseText += part.text;
 }
 }
 }

 let functionCalls = response.functionCalls;
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

 if (response.candidates?.[0]?.content?.parts) {
 formattedContents.push({ role: 'model', parts: response.candidates[0].content.parts });
 } else {
 formattedContents.push({ role: 'model', parts: functionCalls.map((c: any) => ({ functionCall: c })) });
 }
 
 formattedContents.push({ role: 'user', parts: toolResponses });

 response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: formattedContents,
 config: { systemInstruction, tools }
 });
 
 totalTokensUsed += response.usageMetadata?.totalTokenCount || 0;

 finalResponseText = "";
 if (response.candidates?.[0]?.content?.parts) {
 for (const part of response.candidates[0].content.parts) {
 if (typeof part.text === 'string' && !part.thought) {
 finalResponseText += part.text;
 }
 }
 }
 functionCalls = response.functionCalls;
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
