import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toShopTzDayBounds } from '@/lib/timezone';
import { getCalendarBusySlots } from '@/lib/google-calendar';
import { rateLimit } from '@/lib/rate-limiter';
import { getEmailProvider } from '@/lib/messaging-providers';
import QRCode from 'qrcode';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getServicesDecl: FunctionDeclaration = {
  name: 'get_services',
  description: 'Get a list of available services and their prices for the shop',
};

const getStaffDecl: FunctionDeclaration = {
  name: 'get_staff',
  description: 'Get a list of available staff members for the shop',
};

const checkAvailabilityDecl: FunctionDeclaration = {
  name: 'check_availability',
  description: 'Check available time slots for a specific date, service, and optionally staff member',
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
      serviceId: { type: Type.STRING },
      staffId: { type: Type.STRING, description: 'Optional staff ID. If not provided, checks any staff.' }
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
      serviceId: { type: Type.STRING },
      staffId: { type: Type.STRING },
      date: { type: Type.STRING, description: 'Date in YYYY-MM-DD format' },
      time: { type: Type.STRING, description: 'Time in HH:MM format (24-hour, local to shop timezone)' },
      clientName: { type: Type.STRING },
      clientPhone: { type: Type.STRING },
      clientEmail: { type: Type.STRING, description: 'Optional client email' }
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
    const { shopId, messages } = await req.json();

    // 3. Strict Input Validation (Prevent injection / huge payloads)
    if (!shopId || typeof shopId !== 'string' || shopId.length > 100) {
      return NextResponse.json({ error: 'Invalid shopId' }, { status: 400, headers: corsHeaders });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400, headers: corsHeaders });
    }

    // Restrict history size to the last 20 messages to prevent prompt stuffing
    const truncatedMessages = messages.slice(-20).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : (msg.role === 'user' ? 'user' : 'user'),
        // Limit individual message length to 500 characters
        content: String(msg.content || '').substring(0, 500)
    }));

    let shop = await prisma.shop.findFirst({
      where: {
        OR: [
          { id: shopId },
          { subdomain: shopId },
          { companyName: shopId }
        ]
      },
      select: { id: true, name: true, timezone: true, customDomain: true, subdomain: true, customization: true, description: true }
    });

    if (!shop) {
      const namePattern = shopId.replace(/-/g, '%');
      const candidates = await prisma.shop.findMany({
        where: { name: { contains: namePattern.replace(/%/g, ' '), mode: 'insensitive' } },
        take: 10,
        select: { id: true, name: true, timezone: true, customDomain: true, subdomain: true, customization: true, description: true }
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

    // 4. Origin Validation (CORS Hardening)
    const originHeader = req.headers.get('origin') || '';
    const refererHeader = req.headers.get('referer') || '';
    const origin = originHeader || refererHeader;
    
    // Determine allowed origins based on shop domains
    const allowedOrigins = [
      `https://${shop.customDomain}`,
      `http://${shop.customDomain}`,
      `https://${shop.subdomain}.barbersaas.com`,
      `http://${shop.subdomain}.barbersaas.com`,
      `http://localhost:3000`, // Allow local testing
      // Also allow the main saas domain if needed
      `https://barbersaas-henna.vercel.app`,
    ];

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
    // e.g. https://barbersaas-henna.vercel.app/shops/missouri-city
    const isSaaSSubPath = refererHeader && shop.subdomain && refererHeader.includes(`/shops/${shop.subdomain}`);
    const isSaaSIdPath = refererHeader && refererHeader.includes(`/shops/${shopId}`);
    
    // For Vercel preview environments, let's also allow if referer has the slug
    // Missouri City -> missouri-city
    const slug = shop.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const isSaaSSlugPath = refererHeader && refererHeader.includes(`/shops/${slug}`);

    // Allow all cross-origin requests loosely for testing/widget execution across domains
    let isOriginAllowed = true;

    // Block unauthorized embeds strictly
    if (!isOriginAllowed) {
       logger.warn(`Unauthorized origin attempt: ${origin} (referer: ${refererHeader}) for shop: ${shopId}`);
       return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403, headers: corsHeaders });
    }

    const systemInstruction = `You are a helpful AI booking assistant for a barbershop named "${shop.name}". 
Your goal is to help users discover services, find availability, book appointments, check existing appointments, cancel/reschedule appointments, and answer general questions about the shop (location, hours, policies).
Always be polite, concise, and highly intuitive. You are chatting via a lightweight website widget.

Shop Knowledge Base:
- Timezone: ${shop.timezone}
- Today's Date: ${new Date().toISOString().split('T')[0]}
- Description: ${shop.description || 'A great barbershop.'}
- Details & Settings (JSON): ${JSON.stringify(c)}
Use this information to answer user questions about the shop's location, hours, or policies.

CRITICAL UX INSTRUCTIONS:
- Whenever you present multiple options to the user (like services, staff members, or time slots), ALWAYS format them as a clean, numbered list starting each option on a new line with "1. ", "2. ", etc. 
- The frontend will automatically convert these numbered lists into clickable buttons. DO NOT add extra text like "Reply with 1, 2, etc." anymore, as they will click the buttons.
- When listing services, ALWAYS include the price and duration (e.g., "1. Haircut - $30 (45 mins)").
- CRITICAL: When calling tools that require IDs (like check_availability and book_appointment), you MUST use the actual ID string (e.g., "cuid...") returned from the get_services or get_staff tool, NOT the number from your numbered list.
- IMPORTANT STATELESSNESS RULE: The chat history ONLY saves text, not tool responses. You will FORGET the actual IDs (serviceId, staffId) between user messages. 
- Therefore, BEFORE calling 'check_availability' or 'book_appointment', you MUST call 'get_services' (and 'get_staff' if needed) AGAIN in the SAME turn to retrieve the correct IDs based on the user's selection. NEVER guess IDs or pass names/numbers as IDs.
- Keep your messages very short and easy to read on mobile. Avoid large walls of text.

Follow this flow for booking:
1. Ask what service they want. Call get_services to list them (with price and duration). Present as a numbered list.
2. Ask if they have a preferred staff member (call get_staff). Present as a numbered list (always include an "Any staff" option).
3. Do NOT call request_date_picker. Instead, immediately call check_availability for today's date (or a specific date if the user provided one). This will present a combined date and time picker to the user. Present slots as a numbered list.
4. Once they pick a time, ask for their name, phone, and optionally email.
5. Call book_appointment to finalize.
6. After successfully booking, ask the user if they would like you to send them an email with a calendar invite. If they say yes, call send_calendar_invite.

If the user wants to check, cancel, or reschedule their appointments:
1. Ask for their phone number or email if not already provided.
2. Call check_appointments to retrieve their upcoming appointments and present them clearly (with their IDs so you know which one to act on).
3. For cancellation: Call cancel_appointment with the ID. You will FORGET the IDs between messages, so you must call check_appointments AGAIN to get the ID based on the user's selection.
4. For rescheduling: Call reschedule_appointment with the ID, new date, and new time (call check_appointments AGAIN to get the ID, and check_availability to find a new slot).`;

    // Let's reconstruct the conversation for a fresh generateContent call instead of chats.create
    const formattedContents: any[] = truncatedMessages.map((m: any) => ({
        role: m.role,
        parts: [{ text: m.content }]
    }));

    let response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: formattedContents,
        config: {
            systemInstruction,
            tools: [{ functionDeclarations: [getServicesDecl, getStaffDecl, checkAvailabilityDecl, bookAppointmentDecl, checkAppointmentsDecl, sendCalendarInviteDecl, cancelAppointmentDecl, rescheduleAppointmentDecl] }],
        }
    });

    // Handle tool calls
    let finalResponseText = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
    
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
                if (call.name === 'get_services') {
                    const services = await prisma.service.findMany({
                        where: { shopId: realShopId, type: 'CUSTOMER' },
                        select: { id: true, name: true, price: true, duration: true }
                    });
                    result = { services };
                } else if (call.name === 'get_staff') {
                    const staff = await prisma.user.findMany({
                        where: { shopId: realShopId, role: 'STAFF' },
                        select: { id: true, name: true }
                    });
                    result = { staff };
                } else if (call.name === 'check_availability') {
                    const args = call.args as any;
                    const { date, serviceId, staffId } = args;
                    lastAvailabilityDate = date;
                    
                    const service = await prisma.service.findUnique({ where: { id: serviceId }});
                    if (!service) {
                        result = { error: "Service not found" };
                    } else {
                        // Dummy logic for availability to keep it simple for AI demo
                        // In production, this would use google calendar & working hours
                        const generatedSlots = [];
                        for (let hour = 9; hour <= 17; hour++) {
                            for (const min of ["00", "30"]) {
                                if (hour === 17 && min === "30") continue;
                                const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
                                
                                // Simulate some unavailable slots (e.g., 12:00, 12:30, 13:00, 13:30 are greyed out)
                                const isAvailable = (hour !== 12 && hour !== 13);

                                generatedSlots.push({ time: timeStr, staffId: staffId || "any", available: isAvailable });
                            }
                        }

                        result = {
                            availableSlots: generatedSlots.filter(s => s.available).map(s => ({ time: s.time, staffId: s.staffId })),
                            message: "Returning simulated available slots for demonstration."
                        };
                        lastAvailabilitySlots = generatedSlots;
                        lastUiType = 'time_picker';
                    }
                } else if (call.name === 'book_appointment') {
                    const args = call.args as any;
                    const { serviceId, staffId, date, time, clientName, clientPhone, clientEmail } = args;

                    // Create dummy client user
                    const emailToUse = clientEmail || `guest-${Date.now()}@example.com`;

                    let user = await prisma.user.findFirst({
                        where: { shopId: realShopId, OR: [{ email: emailToUse }, { phone: clientPhone }] }
                    });

                    let isNewUser = false;
                    if (!user) {
                        isNewUser = true;
                        user = await prisma.user.create({
                            data: {
                                email: emailToUse,
                                name: clientName,
                                phone: clientPhone,
                                role: 'CLIENT',
                                shopId: realShopId,
                                barcode: `C-${Date.now()}`
                            }
                        });
                    }

                    const startTime = new Date(`${date}T${time}:00Z`); // Note: Timezone needs proper handling
                    const service = await prisma.service.findUnique({ where: { id: serviceId } });

                    if (service) {
                        const endTime = new Date(startTime.getTime() + service.duration * 60000);
                        const apt = await prisma.appointment.create({
                            data: {
                                shopId: realShopId,
                                serviceId,
                                staffId,
                                userId: user.id,
                                startTime,
                                endTime,
                                status: 'SCHEDULED'
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
                    const { clientPhone, clientEmail } = args;
                    
                    if (!clientPhone && !clientEmail) {
                        result = { error: "Please provide either a phone number or an email address." };
                    } else {
                        const userConditions = [];
                        if (clientPhone) userConditions.push({ phone: clientPhone });
                        if (clientEmail) userConditions.push({ email: clientEmail });
                        
                        const users = await prisma.user.findMany({
                            where: { shopId: realShopId, OR: userConditions },
                            select: { id: true }
                        });
                        
                        if (users.length === 0) {
                            result = { message: "No user found with that contact information." };
                        } else {
                            const userIds = users.map(u => u.id);
                            const appointments = await prisma.appointment.findMany({
                                where: { 
                                    shopId: realShopId, 
                                    userId: { in: userIds },
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
                            
                            if (appointments.length === 0) {
                                result = { message: "You have no upcoming appointments." };
                            } else {
                                result = { 
                                    appointments: appointments.map(apt => ({
                                        id: apt.id,
                                        service: apt.service?.name,
                                        staff: apt.staff?.name,
                                        date: apt.startTime.toISOString().split('T')[0],
                                        time: apt.startTime.toISOString().split('T')[1].substring(0, 5)
                                    }))
                                };
                            }
                        }
                    }
                } else if (call.name === 'send_calendar_invite') {
                    const args = call.args as any;
                    const { appointmentId, clientEmail } = args;
                    if (!appointmentId || !clientEmail) {
                        result = { error: "Missing appointmentId or clientEmail." };
                    } else {
                        const apt = await prisma.appointment.findUnique({
                            where: { id: appointmentId },
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
                                'PRODID:-//BarberSaaS//EN',
                                'BEGIN:VEVENT',
                                `UID:${apt.id}@barbersaas.com`,
                                `DTSTAMP:${startStr}`,
                                `DTSTART:${startStr}`,
                                `DTEND:${endStr}`,
                                `SUMMARY:${apt.service?.name || 'Appointment'} at ${apt.shop.name}`,
                                `DESCRIPTION:Your appointment for ${apt.service?.name || 'Service'}`,
                                'END:VEVENT',
                                'END:VCALENDAR'
                            ].join('\r\n');
                            
                            const emailProvider = getEmailProvider();
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
                        await prisma.appointment.update({
                            where: { id: appointmentId },
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
                        const apt = await prisma.appointment.findUnique({ where: { id: appointmentId }});
                        if (!apt) {
                            result = { error: "Appointment not found." };
                        } else {
                            const startTime = new Date(`${date}T${time}:00Z`); // Timezone needs proper handling
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

        // Append tool calls and responses to contents
        formattedContents.push(
            { role: 'model', parts: functionCalls.map(c => ({ functionCall: c })) }
        );
        formattedContents.push(
            { role: 'user', parts: toolResponses } // Note: tool responses are usually passed as "user" or "tool" role depending on SDK version
        );

        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedContents,
            config: {
                systemInstruction,
                tools: [{ functionDeclarations: [getServicesDecl, getStaffDecl, checkAvailabilityDecl, bookAppointmentDecl, checkAppointmentsDecl, sendCalendarInviteDecl, cancelAppointmentDecl, rescheduleAppointmentDecl] }],
            }
        });

        finalResponseText = response.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join("") || "";
        
        functionCalls = response.functionCalls;
    }

    const payload: any = { text: finalResponseText };
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
