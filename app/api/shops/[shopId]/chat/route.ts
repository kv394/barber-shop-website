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

 const messages = await tenantClient.message.findMany({
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

 const systemInstruction = `You are an expert AI assistant and Shop Administrator for this barbershop platform.
The user asking this question has the role: ${user.role}.
If they ask for information, you can answer.
If they ask you to modify shop data (e.g. add a service, change a price), use your tools to perform the action and report back what you did.
ONLY use tools if the user role is SHOP_ADMIN or SITE_ADMIN.`;

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
 result = { error: err.message };
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
