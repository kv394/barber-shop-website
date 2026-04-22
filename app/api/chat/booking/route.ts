import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toShopTzDayBounds } from '@/lib/timezone';
import { getCalendarBusySlots } from '@/lib/google-calendar';
import { rateLimit } from '@/lib/rate-limiter';

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

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, timezone: true, customDomain: true, subdomain: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: corsHeaders });
    }

    // 4. Origin Validation (CORS Hardening)
    const origin = req.headers.get('origin') || req.headers.get('referer') || '';
    // Determine allowed origins based on shop domains
    const allowedOrigins = [
      `https://${shop.customDomain}`,
      `http://${shop.customDomain}`,
      `https://${shop.subdomain}.barbersaas.com`,
      `http://${shop.subdomain}.barbersaas.com`,
      `http://localhost:3000`, // Allow local testing
      // Also allow the main saas domain if needed
      `https://barbersaas.com`,
    ];

    let isOriginAllowed = false;
    if (!origin) {
       // If no origin/referer (e.g. cURL), we might block it, but for now we'll allow strictly 
       // if we enforce it to be coming from a browser. Let's block non-browser requests to harden it.
       isOriginAllowed = false;
    } else {
       isOriginAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));
    }

    // Block unauthorized embeds strictly
    if (!isOriginAllowed) {
       logger.warn(`Unauthorized origin attempt: ${origin} for shop: ${shopId}`);
       return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403, headers: corsHeaders });
    }

    const systemInstruction = `You are a helpful AI booking assistant for a barbershop named "${shop.name}". 
Your goal is to help users discover services, find availability, and book appointments.
Always be polite, concise, and highly intuitive. You are chatting via a lightweight website widget.
The shop timezone is ${shop.timezone}.

CRITICAL UX INSTRUCTIONS:
- Whenever you present multiple options to the user (like services, staff members, or time slots), ALWAYS format them as a clean, numbered list.
- Explicitly tell the user they can simply reply with the number of their choice (e.g., "Reply with 1, 2, etc.").
- When the user replies with a number, map it to the corresponding option from your previous message.
- Keep your messages very short and easy to read on mobile. Avoid large walls of text.

Follow this flow:
1. Ask what service they want. Call get_services to list them. Present as a numbered list.
2. Ask if they have a preferred staff member (call get_staff). Present as a numbered list (always include an "Any staff" option).
3. Ask for a date, then call check_availability to give them specific time slots. Present slots as a numbered list.
4. Once they pick a time, ask for their name, phone, and optionally email.
5. Call book_appointment to finalize.`;

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
            tools: [{ functionDeclarations: [getServicesDecl, getStaffDecl, checkAvailabilityDecl, bookAppointmentDecl] }],
        }
    });

    // Handle tool calls
    let finalResponseText = response.text;
    
    // We need to iterate if there are function calls
    let functionCalls = response.functionCalls;
    let loopCount = 0;
    
    let lastAvailabilitySlots = null;
    let lastAvailabilityDate = null;

    while (functionCalls && functionCalls.length > 0 && loopCount < 5) {
        loopCount++;
        const toolResponses = [];

        for (const call of functionCalls) {
            let result: any = {};
            try {
                if (call.name === 'get_services') {
                    const services = await prisma.service.findMany({
                        where: { shopId, type: 'CUSTOMER' },
                        select: { id: true, name: true, price: true, duration: true }
                    });
                    result = { services };
                } else if (call.name === 'get_staff') {
                    const staff = await prisma.user.findMany({
                        where: { shopId, role: 'STAFF' },
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
                        result = {
                            availableSlots: [
                                { time: "09:00", staffId: staffId || "any" },
                                { time: "10:30", staffId: staffId || "any" },
                                { time: "14:00", staffId: staffId || "any" },
                            ],
                            message: "Returning simulated available slots for demonstration."
                        };
                        lastAvailabilitySlots = result.availableSlots;
                    }
                } else if (call.name === 'book_appointment') {
                    const args = call.args as any;
                    const { serviceId, staffId, date, time, clientName, clientPhone, clientEmail } = args;
                    
                    // Create dummy client user
                    const emailToUse = clientEmail || `guest-${Date.now()}@example.com`;
                    
                    let user = await prisma.user.findFirst({
                        where: { OR: [{ email: emailToUse }, { phone: clientPhone }] }
                    });
                    
                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                email: emailToUse,
                                name: clientName,
                                phone: clientPhone,
                                role: 'CLIENT',
                                shopId: shopId
                            }
                        });
                    }

                    const startTime = new Date(`${date}T${time}:00Z`); // Note: Timezone needs proper handling
                    const service = await prisma.service.findUnique({ where: { id: serviceId } });
                    
                    if (service) {
                        const endTime = new Date(startTime.getTime() + service.duration * 60000);
                        const apt = await prisma.appointment.create({
                            data: {
                                shopId,
                                serviceId,
                                staffId,
                                userId: user.id,
                                startTime,
                                endTime,
                                status: 'SCHEDULED'
                            }
                        });
                        result = { success: true, appointmentId: apt.id };
                    } else {
                        result = { success: false, error: "Service not found" };
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
                tools: [{ functionDeclarations: [getServicesDecl, getStaffDecl, checkAvailabilityDecl, bookAppointmentDecl] }],
            }
        });

        finalResponseText = response.text;
        functionCalls = response.functionCalls;
    }

    const payload: any = { text: finalResponseText };
    if (lastAvailabilitySlots) {
        payload.ui = {
            type: 'time_picker',
            date: lastAvailabilityDate,
            slots: lastAvailabilitySlots
        };
    }

    return NextResponse.json(payload, { headers: corsHeaders });
  } catch (error: any) {
    logger.error("Chat API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
