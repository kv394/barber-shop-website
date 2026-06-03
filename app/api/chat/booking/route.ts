import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toShopTzDayBounds } from '@/lib/timezone';
import { getCalendarBusySlots } from '@/lib/google-calendar';
import { rateLimit } from '@/lib/rate-limiter';
import { getEmailProviderForShop } from '@/lib/messaging-providers';
import { scoreAndSortSlots } from '@/lib/schedule-optimizer';
import QRCode from 'qrcode';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const checkAvailabilityDecl: FunctionDeclaration = {
 name: 'check_availability',
 description: 'Check available time slots for a specific date, service, and optionally staff member',
 parameters: {
 type: Type.OBJECT,
 properties: {
 date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format. MUST calculate internally if user provides relative date.' },
 serviceId: { type: Type.STRING, description: 'The ID of the service. MUST map from service name internally.' },
 staffId: { type: Type.STRING, description: 'Optional staff ID. MUST map from staff name internally. If not provided, checks any staff.' }
 },
 required: ['date', 'serviceId']
 }
};

const bookAppointmentDecl: FunctionDeclaration = {
 name: 'book_appointment',
 description: 'Book an appointment for the user',
 parameters: {
 type: Type.OBJECT,
 properties: {
 serviceId: { type: Type.STRING, description: 'The ID of the service. MUST map from service name internally.' },
 staffId: { type: Type.STRING, description: 'The ID of the staff. MUST map from staff name internally.' },
 date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format. MUST calculate internally.' },
 time: { type: Type.STRING, description: 'Time in HH:MM format (24-hour, local to shop timezone)' },
 clientName: { type: Type.STRING },
 clientPhone: { type: Type.STRING },
 clientEmail: { type: Type.STRING, description: 'Optional client email' },
 serviceLocation: { type: Type.STRING, description: 'Optional physical address for mobile/house call services' }
 },
 required: ['serviceId', 'staffId', 'date', 'time', 'clientName', 'clientPhone']
 }
};

const checkAppointmentsDecl: FunctionDeclaration = {
 name: 'check_appointments',
 description: 'Check existing upcoming appointments for a user',
 parameters: {
 type: Type.OBJECT,
 properties: {
 clientName: { type: Type.STRING, description: 'Client name' },
 clientPhone: { type: Type.STRING, description: 'Client phone number' },
 clientEmail: { type: Type.STRING, description: 'Client email address' }
 }
 }
};

const sendCalendarInviteDecl: FunctionDeclaration = {
 name: 'send_calendar_invite',
 description: 'Send an email with a calendar invite to the user for an appointment',
 parameters: {
 type: Type.OBJECT,
 properties: {
 clientEmail: { type: Type.STRING, description: 'The email address of the client' },
 appointmentId: { type: Type.STRING, description: 'The ID of the appointment' }
 },
 required: ['clientEmail', 'appointmentId']
 }
};

const cancelAppointmentDecl: FunctionDeclaration = {
 name: 'cancel_appointment',
 description: 'Cancel an existing appointment',
 parameters: {
 type: Type.OBJECT,
 properties: {
 appointmentId: { type: Type.STRING, description: 'The ID of the appointment to cancel' }
 },
 required: ['appointmentId']
 }
};

const rescheduleAppointmentDecl: FunctionDeclaration = {
 name: 'reschedule_appointment',
 description: 'Reschedule an existing appointment to a new date and time',
 parameters: {
 type: Type.OBJECT,
 properties: {
 appointmentId: { type: Type.STRING, description: 'The ID of the appointment to reschedule' },
 date: { type: Type.STRING, description: 'New date in YYYY-MM-DD format' },
 time: { type: Type.STRING, description: 'New time in HH:MM format (24-hour)' }
 },
 required: ['appointmentId', 'date', 'time']
 }
};

const corsHeaders = {
 'Access-Control-Allow-Origin': '*', // For strict security, change to specific domains
 'Access-Control-Allow-Methods': 'POST, OPTIONS',
 'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS(req: Request) {
 return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: Request) {
 try {
 // 1. Rate Limiting (Prevent abuse / DDoS)
 const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
 // Limit to 10 requests per minute per IP
 const rl = await rateLimit(`chat-booking:${ip}`, 10, 60);
 if (!rl.success) {
 logger.warn(`Rate limit exceeded for IP: ${ip}`);
 return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: corsHeaders });
 }

 // 2. Parse Payload
 const { shopId, messages, userTimezone } = await req.json();

 // 3. Strict Input Validation (Prevent injection / huge payloads)
 if (!shopId || typeof shopId !== 'string' || shopId.length > 100) {
 return NextResponse.json({ error: 'Invalid shopId' }, { status: 400, headers: corsHeaders });
 }

 if (!messages || !Array.isArray(messages) || messages.length === 0) {
 return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400, headers: corsHeaders });
 }

 // Restrict history size to the last 20 messages to prevent prompt stuffing
 const truncatedMessages = messages.slice(-20);
 // Let's reconstruct the conversation for a fresh generateContent call instead of chats.create
 const formattedContents: any[] = truncatedMessages.map((m: any) => {
 if (m.parts) {
 return m; // Use raw Gemini format
 }
 return {
 role: m.role === 'assistant' ? 'model' : 'user',
 parts: [{ text: String(m.content || '').substring(0, 500) }]
 };
 });

 let shop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: shopId },
 { subdomain: shopId },
 { companyName: shopId }
 ]
 },
 select: { id: true, name: true, timezone: true, customDomain: true, subdomain: true, customization: true, description: true, shopType: true, travelFee: true, baseLocation: true }
 });

 if (!shop) {
 const firstWord = shopId.split('-').find(w => w.length > 2) || shopId.split('-')[0];
 const candidates = await prisma.shop.findMany({
 where: { name: { contains: firstWord, mode: 'insensitive' } },
 take: 50,
 select: { id: true, name: true, timezone: true, customDomain: true, subdomain: true, customization: true, description: true, shopType: true, travelFee: true, baseLocation: true }
 });
 shop = candidates.find(
 (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === shopId.toLowerCase()
 ) || null;
 }

 if (!shop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
 }
 
 // IMPORTANT: Update shopId context variable so the API routes use the actual database ID going forward
 const realShopId = shop.id;

 const c = (shop.customization as any) || {};
 const configuredWebsite = c.contact?.website || c.website || '';

 // Fetch services and staff to inject into prompt for massive performance boost
 const services = await prisma.service.findMany({
 where: { shopId: realShopId, type: 'CUSTOMER' },
 select: { id: true, name: true, price: true, duration: true }
 });
 const staff = await prisma.user.findMany({
 where: { shopId: realShopId, role: 'STAFF' },
 select: { id: true, name: true }
 });

 const servicesText = services.length > 0 
 ? services.map((s: { id: string; name: string; price: number; duration: number }) => `- ${s.name}: $${s.price} (${s.duration} mins) [ID: ${s.id}]`).join('\n')
 : 'No services available currently.';
 
 const staffText = staff.length > 0
 ? staff.map(s => `- ${s.name || 'Staff Member'} [ID: ${s.id}]`).join('\n')
 : 'No specific staff available.';

 // 4. Origin Validation (CORS Hardening)
 const originHeader = req.headers.get('origin') || '';
 const refererHeader = req.headers.get('referer') || '';
 const origin = originHeader || refererHeader;
 
 // Determine allowed origins based on shop domains
 const allowedOrigins = [
 `https://${shop.customDomain}`,
 `http://${shop.customDomain}`,
 `https://${shop.subdomain}.kutzapp.com`,
 `http://${shop.subdomain}.kutzapp.com`,
 `http://localhost:3000`, // Allow local testing
 // Also allow the main saas domain if needed
 ];
 const rootDomainStr = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000,kutzapp.vercel.app';
 rootDomainStr.split(',').forEach(d => {
 allowedOrigins.push(`https://${d}`);
 allowedOrigins.push(`http://${d}`);
 });

 if (configuredWebsite) {
 // Add the configured website directly
 allowedOrigins.push(configuredWebsite);
 // Try to parse the origin to make sure we also allow the base origin
 try {
 const urlObj = new URL(configuredWebsite.startsWith('http') ? configuredWebsite : `https://${configuredWebsite}`);
 allowedOrigins.push(urlObj.origin);
 } catch (e) {
 // ignore invalid urls
 }
 }

 // Always allow requests if they come from the shop's specific sub-path on the SaaS
 // This allows previewing/testing on Vercel deployments.
 // e.g. https://kutzapp-henna.vercel.app/shops/missouri-city
 const isSaaSSubPath = refererHeader && shop.subdomain && refererHeader.includes(`/shops/${shop.subdomain}`);
 const isSaaSIdPath = refererHeader && refererHeader.includes(`/shops/${shopId}`);
 
 // For Vercel preview environments, let's also allow if referer has the slug
 // Missouri City -> missouri-city
 const slug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
 const isSaaSSlugPath = refererHeader && refererHeader.includes(`/shops/${slug}`);

 let isOriginAllowed = !origin || allowedOrigins.some(ao => origin.startsWith(ao)) || isSaaSSubPath || isSaaSIdPath || isSaaSSlugPath;

 // Block unauthorized embeds strictly
 if (!isOriginAllowed) {
 logger.warn(`Unauthorized origin attempt: ${origin} (referer: ${refererHeader}) for shop: ${shopId}`);
 return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403, headers: corsHeaders });
 }

 const shopTz = shop.timezone || 'America/New_York';
 const effectiveTz = userTimezone || shopTz;
 const userDateStr = new Intl.DateTimeFormat('en-CA', { 
 timeZone: effectiveTz, 
 year: 'numeric', 
 month: '2-digit', 
 day: '2-digit' 
 }).format(new Date());

 const systemInstruction = `You are a helpful AI booking assistant for a barbershop named "${shop.name}". 
Your goal is to help users discover services, find availability, book appointments, check existing appointments, cancel/reschedule appointments, and answer general questions about the shop (location, hours, policies). You are also allowed to answer general questions like "what is today's date?".
Always be polite, concise, and highly intuitive. You are chatting via a lightweight website widget.

Shop Knowledge Base:
- Shop Timezone: ${shop.timezone}
- Today's Date: ${userDateStr} (This is the exact local date of the user right now).
- Date Calculation: If the user uses relative dates like "tomorrow", "next week", or a day of the week, calculate the exact YYYY-MM-DD date based on Today's Date. 
- You MUST answer the user directly if they ask "what is today's date" or similar questions.
- Description: ${shop.description || 'A great barbershop.'}
- Business Type: ${shop.shopType}. If MOBILE or HYBRID, you must ask the client for the address of the house call before booking. Travel fee is $${shop.travelFee || 0}. The shop's physical address or stylist's base location is: ${shop.baseLocation || 'Unknown'}.
- Details & Settings (JSON): ${JSON.stringify(c)}
Use this information to answer user questions about the shop's location, hours, or policies.

AVAILABLE SERVICES:
${servicesText}

AVAILABLE STAFF:
${staffText}

CRITICAL UX INSTRUCTIONS:
- Whenever you present multiple options to the user (like services, staff members, or time slots), ALWAYS format them as a clean, numbered list starting each option on a new line with "1. ", "2. ", etc. 
- The frontend will automatically convert these numbered lists into clickable buttons. DO NOT add extra text like "Reply with 1, 2, etc." anymore, as they will click the buttons.
- When listing services, ALWAYS include the price and duration (e.g., "1. Haircut - $30 (45 mins)"). DO NOT output their IDs to the user.
- CRITICAL: When calling tools that require IDs (like check_availability and book_appointment), you MUST use the actual ID string (e.g., "cuid...") from the AVAILABLE SERVICES or AVAILABLE STAFF lists provided above.
- NEVER guess IDs or pass names/numbers as IDs. Map the user's input (numbered choice or name) back to the correct ID internally.
- NEVER ask the user for a Staff ID, Service ID, or an exact date (like YYYY-MM-DD) if they provide a name or a relative date (like "tomorrow"). You have the lists and Today's Date; resolve them internally!
- Keep your messages very short and easy to read on mobile. Avoid large walls of text.

Follow this flow for booking:
1. Ask what service they want. List the AVAILABLE SERVICES (with price and duration). Present as a numbered list.
2. Ask if they have a preferred staff member. Present the AVAILABLE STAFF as a numbered list (always include an "Any staff" option).
3. Do NOT call request_date_picker. Instead, immediately call check_availability for Today's Date (or a specific date if the user provided one). This will present a combined date and time picker to the user. Present slots as a numbered list.
4. Once they pick a time, ask for their name, phone, and optionally email.
5. Call book_appointment to finalize.
6. After successfully booking, ask the user if they would like you to send them an email with a calendar invite. If they say yes, call send_calendar_invite.

If the user wants to check, cancel, or reschedule their appointments, or asks for client details:
1. Ask for their name, phone number, or email if not already provided.
2. Call check_appointments to retrieve their user details and upcoming appointments. Present them clearly (with their IDs so you know which one to act on).
3. For cancellation: Call cancel_appointment with the ID. You will FORGET the IDs between messages, so you must call check_appointments AGAIN to get the ID based on the user's selection.
4. For rescheduling: Call reschedule_appointment with the ID, new date, and new time (call check_appointments AGAIN to get the ID, and check_availability to find a new slot).`;

 let response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: formattedContents,
 config: {
 systemInstruction,
 tools: [{ functionDeclarations: [checkAvailabilityDecl, bookAppointmentDecl, checkAppointmentsDecl, sendCalendarInviteDecl, cancelAppointmentDecl, rescheduleAppointmentDecl] }],
 }
 });

 // Handle tool calls
 let finalResponseText = "";
 if (response.candidates?.[0]?.content?.parts) {
 for (const part of response.candidates[0].content.parts) {
 if (typeof part.text === 'string' && !part.thought) {
 finalResponseText += part.text;
 }
 }
 }
 
 // We need to iterate if there are function calls
 let functionCalls = response.functionCalls;
 let loopCount = 0;
 
 let lastUiType: string | null = null;
 let lastAvailabilitySlots = null;
 let lastAvailabilityDate = null;
 let lastQrCodeUrl: string | null = null;

 while (functionCalls && functionCalls.length > 0 && loopCount < 5) {
 loopCount++;
 const toolResponses = [];

 for (const call of functionCalls) {
 let result: any = {};
 try {
 if (call.name === 'check_availability') {
 const args = call.args as any;
 const { date, serviceId, staffId } = args;
 lastAvailabilityDate = date;
 
 let service = await prisma.service.findUnique({ where: { id: serviceId }});
 if (!service && serviceId) {
 // Fallback to name search in case LLM passes name instead of ID
 service = await prisma.service.findFirst({ where: { shopId: realShopId, name: { contains: serviceId, mode: 'insensitive' } } });
 }

 if (!service) {
 result = { error: "Service not found. Ensure you provided a valid service ID or name." };
 } else {
 
 const shopTz = shop.timezone || 'America/New_York';
 const { startOfDay, endOfDay } = toShopTzDayBounds(date, shopTz);
 
 const appointments = await prisma.appointment.findMany({
 where: { shopId: realShopId, startTime: { gte: startOfDay, lt: endOfDay }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
 select: { startTime: true, endTime: true, staffId: true }
 });
 
 let targetStaff: any[] = [];
 if (staffId) {
 targetStaff = await prisma.user.findMany({
 where: { shopId: realShopId, role: 'STAFF', id: staffId }
 });
 if (targetStaff.length === 0) {
 // Fallback to searching by staff name
 targetStaff = await prisma.user.findMany({
 where: { shopId: realShopId, role: 'STAFF', name: { contains: staffId, mode: 'insensitive' } }
 });
 }
 }
 if (targetStaff.length === 0) {
 targetStaff = await prisma.user.findMany({ where: { shopId: realShopId, role: 'STAFF' } });
 }
 
 const googleBusySlotsPromises = targetStaff.map(async (st: any) => {
 const busySlots = await getCalendarBusySlots(st.id, startOfDay, endOfDay);
 return busySlots.map((slot: any) => ({ startTime: slot.startTime, endTime: slot.endTime, staffId: st.id }));
 });
 const googleBusySlotsNested = await Promise.all(googleBusySlotsPromises);
 const allBusySlots = [...appointments, ...googleBusySlotsNested.flat()];
 
 const generatedSlots = [];
 for (let hour = 9; hour <= 17; hour++) {
 for (const min of [0, 30]) {
 if (hour === 17 && min === 30) continue;
 
 const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
 const slotStartTime = new Date(startOfDay.getTime() + (hour * 60 + min) * 60000);
 const slotEndTime = new Date(slotStartTime.getTime() + service.duration * 60000);
 
 let isAvailable = false;
 let availableStaffId = null;
 
 for (const st of targetStaff) {
 const staffBusy = allBusySlots.filter(s => s.staffId === st.id);
 const hasOverlap = staffBusy.some(bs => slotStartTime < bs.endTime && slotEndTime > bs.startTime);
 if (!hasOverlap) {
 isAvailable = true;
 availableStaffId = st.id;
 break;
 }
 }
 
 if (isAvailable) {
 generatedSlots.push({ time: timeStr, staffId: staffId || availableStaffId, available: true });
 }
 }
 }
 
 if (generatedSlots.length === 0) {
 result = { message: "No available slots on this date. Please try another date." };
 } else {
 // Score and sort slots by gap-fill efficiency
 const scoredSlots = scoreAndSortSlots(
 generatedSlots.map(s => ({ time: s.time, staffId: s.staffId || '' })),
 allBusySlots.map(b => ({ startTime: b.startTime, endTime: b.endTime, staffId: b.staffId })),
 date,
 service.duration
 );
 result = {
 availableSlots: scoredSlots.map(s => ({ time: s.time, staffId: s.staffId, isRecommended: s.isRecommended })),
 message: "Returning available slots to the user interface. Slots marked as recommended are the best fit for the schedule."
 };
 lastAvailabilitySlots = scoredSlots;
 lastUiType = 'time_picker';
 }
 }
 } else if (call.name === 'book_appointment') {
 const args = call.args as any;
 const { serviceId, staffId, date, time, clientName, clientEmail, serviceLocation } = args;

  // Create dummy client user
  const emailToUse = (clientEmail || `guest-${Date.now()}@example.com`).trim().toLowerCase();

  // Search globally by email to avoid unique constraint violations
  let user = await prisma.user.findUnique({ where: { email: emailToUse } });

  let isNewUser = false;
  if (!user) {
  isNewUser = true;
  user = await prisma.user.create({
  data: {
  email: emailToUse,
  name: clientName,
  role: 'CLIENT',
  shopId: realShopId,
  barcode: `C-${Date.now()}`
  }
  });
  }

 const shopTz = shop.timezone || 'America/New_York';
 const { startOfDay } = toShopTzDayBounds(date, shopTz);
 const [h, m] = time.split(':');
 const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);
 
 let service = await prisma.service.findUnique({ where: { id: serviceId } });
 if (!service && serviceId) {
 service = await prisma.service.findFirst({ where: { shopId: realShopId, name: { contains: serviceId, mode: 'insensitive' } } });
 }
 
 let finalStaffId = staffId;
 if (staffId) {
 let staffCheck = await prisma.user.findUnique({ where: { id: staffId } });
 if (!staffCheck) {
 staffCheck = await prisma.user.findFirst({ where: { shopId: realShopId, role: 'STAFF', name: { contains: staffId, mode: 'insensitive' } } });
 if (staffCheck) finalStaffId = staffCheck.id;
 }
 }

 if (service) {
 const endTime = new Date(startTime.getTime() + service.duration * 60000);
 const apt = await prisma.appointment.create({
 data: {
 shopId: realShopId,
 serviceId: service.id,
 staffId: finalStaffId,
 userId: user.id,
 startTime,
 endTime,
 status: 'SCHEDULED',
 serviceLocation: serviceLocation || null
 }
 }); 
 if (isNewUser) {
 lastQrCodeUrl = await QRCode.toDataURL(user.barcode || user.id);
 lastUiType = 'qr_code';
 }
 
 result = { success: true, appointmentId: apt.id, isNewUser };
 } else {
 result = { success: false, error: "Service not found" };
 }
 } else if (call.name === 'check_appointments') {
 const args = call.args as any;
 const { clientName, clientEmail } = args;
 
 if (!clientName && !clientEmail) {
 result = { error: "Please provide either a name or an email address." };
 } else {
 const userConditions: any[] = [];
 if (clientName) userConditions.push({ name: { contains: clientName, mode: 'insensitive' } });
 if (clientEmail) userConditions.push({ email: clientEmail });
 
 const users = await prisma.user.findMany({
 where: { shopId: realShopId, OR: userConditions.length > 0 ? userConditions : undefined },
 select: { id: true, name: true, email: true }
 });
 
 if (users.length === 0) {
 result = { message: "No user found with that contact information." };
 } else {
 const user = users[0];
 const appointments = await prisma.appointment.findMany({
 where: { 
 shopId: realShopId, 
 userId: user.id,
 startTime: { gte: new Date() },
 status: { notIn: ['CANCELLED', 'NO_SHOW'] }
 },
 include: {
 service: { select: { name: true } },
 staff: { select: { name: true } }
 },
 orderBy: { startTime: 'asc' },
 take: 5
 });
 
 result = { 
 userDetails: {
 name: user.name,
 email: user.email
 },
 appointments: appointments.length > 0 ? appointments.map((apt: any) => ({
 id: apt.id,
 service: apt.service?.name,
 staff: apt.staff?.name,
 date: apt.startTime.toISOString().split('T')[0],
 time: apt.startTime.toISOString().split('T')[1].substring(0, 5)
 })) : "No upcoming appointments."
 };
 }
 }
 } else if (call.name === 'send_calendar_invite') {
 const args = call.args as any;
 const { appointmentId, clientEmail } = args;
 if (!appointmentId || !clientEmail) {
 result = { error: "Missing appointmentId or clientEmail." };
 } else {
 const apt = await prisma.appointment.findFirst({
 where: { id: appointmentId, shopId: realShopId },
 include: { service: true, shop: true }
 });
 
 if (!apt) {
 result = { error: "Appointment not found." };
 } else {
 const startTime = apt.startTime;
 const endTime = apt.endTime;
 const startStr = startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
 const endStr = endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
 
 const icsContent = [
 'BEGIN:VCALENDAR',
 'VERSION:2.0',
 'PRODID:-//Kutz//EN',
 'BEGIN:VEVENT',
 `UID:${apt.id}@kutzapp.com`,
 `DTSTAMP:${startStr}`,
 `DTSTART:${startStr}`,
 `DTEND:${endStr}`,
 `SUMMARY:${apt.service?.name || 'Appointment'} at ${apt.shop.name}`,
 `DESCRIPTION:Your appointment for ${apt.service?.name || 'Service'}`,
 'END:VEVENT',
 'END:VCALENDAR'
 ].join('\r\n');
 
 const emailProvider = await getEmailProviderForShop(realShopId);
 const emailRes = await emailProvider.send(
 clientEmail,
 `Calendar Invite: ${apt.service?.name || 'Appointment'} at ${apt.shop.name}`,
 `Hi! Please find your calendar invite attached for your upcoming appointment.`,
 undefined,
 [{ filename: 'invite.ics', content: Buffer.from(icsContent).toString('base64'), type: 'text/calendar' }]
 );
 
 if (emailRes.success) {
 result = { message: "Calendar invite sent successfully." };
 } else {
 result = { error: "Failed to send calendar invite." };
 }
 }
 }
 } else if (call.name === 'cancel_appointment') {
 const args = call.args as any;
 const { appointmentId } = args;
 if (!appointmentId) {
 result = { error: "Missing appointmentId." };
 } else {
 const cancelTarget = await prisma.appointment.findFirst({ where: { id: appointmentId, shopId: realShopId } });
 if (!cancelTarget) { result = { error: "Appointment not found." }; continue; }
 await prisma.appointment.update({
 where: { id: cancelTarget.id },
 data: { status: 'CANCELLED' }
 });
 result = { success: true, message: "Appointment cancelled." };
 }
 } else if (call.name === 'reschedule_appointment') {
 const args = call.args as any;
 const { appointmentId, date, time } = args;
 if (!appointmentId || !date || !time) {
 result = { error: "Missing required arguments." };
 } else {
 const apt = await prisma.appointment.findFirst({ where: { id: appointmentId, shopId: realShopId }});
 if (!apt) {
 result = { error: "Appointment not found." };
 } else {
 const shopTz = shop.timezone || 'America/New_York';
 const { startOfDay } = toShopTzDayBounds(date, shopTz);
 const [h, m] = time.split(':');
 const startTime = new Date(startOfDay.getTime() + (parseInt(h) * 60 + parseInt(m)) * 60000);
 const service = await prisma.service.findUnique({ where: { id: apt.serviceId || undefined } });
 const endTime = new Date(startTime.getTime() + (service?.duration || 30) * 60000);
 
 await prisma.appointment.update({
 where: { id: appointmentId },
 data: { startTime, endTime }
 });
 result = { success: true, message: "Appointment rescheduled." };
 }
 }
 }
 } catch (err: any) {
 logger.error("Tool execution error:", err);
 result = { error: err.message };
 }

 toolResponses.push({
 functionResponse: {
 name: call.name,
 response: result
 }
 });
 }

 // Append exactly what the model returned to keep history intact
 if (response.candidates?.[0]?.content?.parts) {
 formattedContents.push(
 { role: 'model', parts: response.candidates[0].content.parts }
 );
 } else {
 formattedContents.push(
 { role: 'model', parts: functionCalls.map(c => ({ functionCall: c })) }
 );
 }
 
 // Use the proper role for tool responses (in @google/genai it's 'user' or 'function', 'user' usually works for tool responses if parts has functionResponse)
 formattedContents.push(
 { role: 'user', parts: toolResponses } 
 );

 response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: formattedContents,
 config: {
 systemInstruction,
 tools: [{ functionDeclarations: [checkAvailabilityDecl, bookAppointmentDecl, checkAppointmentsDecl, sendCalendarInviteDecl, cancelAppointmentDecl, rescheduleAppointmentDecl] }],
 }
 });

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

 // Sanitize LLM output to prevent reflected XSS
 finalResponseText = finalResponseText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

 const payload: any = { text: finalResponseText, history: formattedContents };
 if (lastUiType === 'date_picker') {
 payload.ui = {
 type: 'date_picker'
 };
 } else if (lastUiType === 'time_picker' && lastAvailabilitySlots) {
 payload.ui = {
 type: 'time_picker',
 date: lastAvailabilityDate,
 slots: lastAvailabilitySlots
 };
 } else if (lastUiType === 'qr_code' && lastQrCodeUrl) {
 payload.ui = {
 type: 'qr_code',
 qrCodeUrl: lastQrCodeUrl
 };
 }

 return NextResponse.json(payload, { headers: corsHeaders });
 } catch (error: any) {
 logger.error("Chat API error:", error);
 return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
 }
}
