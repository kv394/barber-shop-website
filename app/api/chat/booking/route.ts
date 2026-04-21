import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { toShopTzDayBounds } from '@/lib/timezone';
import { getCalendarBusySlots } from '@/lib/google-calendar';

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

export async function POST(req: Request) {
  try {
    const { shopId, messages } = await req.json();

    if (!shopId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { name: true, timezone: true }
    });

    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    const systemInstruction = `You are a helpful AI booking assistant for a barbershop named "${shop.name}". 
Your goal is to help users discover services, find availability, and book appointments.
Always be polite and concise. You are chatting via a lightweight website widget.
The shop timezone is ${shop.timezone}.
Follow this flow:
1. Ask what service they want. Call get_services to list them.
2. Ask if they have a preferred staff member (call get_staff).
3. Ask for a date, then call check_availability to give them specific time slots.
4. Once they pick a time, ask for their name, phone, and optionally email.
5. Call book_appointment to finalize.`;

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: [getServicesDecl, getStaffDecl, checkAvailabilityDecl, bookAppointmentDecl] }],
      },
    });

    // Replay history
    for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        // We only append user messages to the chat session for simplicity in this stateless example.
        // In a real robust system, we would serialize/deserialize the full history including tool calls.
        // Since Gemini chats.create() manages state, we'll just send the entire conversation as a new message 
        // to a fresh model instance instead of using the chat session, to avoid complex history reconstruction.
    }

    // Let's reconstruct the conversation for a fresh generateContent call instead of chats.create
    const formattedContents: any[] = messages.map((m: any) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
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

    return NextResponse.json({ text: finalResponseText });
  } catch (error: any) {
    logger.error("Chat API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
