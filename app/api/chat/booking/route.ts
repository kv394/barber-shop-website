import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { rateLimit } from '@/lib/rate-limiter';

import { getCorsHeaders, isOriginAllowedForShop, handleOptions } from '@/lib/chat/cors';
import { resolveShop } from '@/lib/chat/shop-resolver';
import { allToolDeclarations } from '@/lib/chat/tool-declarations';
import { buildSystemInstruction } from '@/lib/chat/system-prompt';
import type { ToolHandlerContext, ToolHandlerResult } from '@/lib/chat/types';
import {
  handleCheckAvailability,
  handleBookAppointment,
  handleCheckAppointments,
  handleSendCalendarInvite,
  handleCancelAppointment,
  handleRescheduleAppointment,
} from '@/lib/chat/tools';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function OPTIONS(req: Request) {
  return handleOptions(req);
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (Prevent abuse / DDoS)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    // Limit to 10 requests per minute per IP
    const rl = await rateLimit(`chat-booking:${ip}`, 10, 60);
    if (!rl.success) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429, headers: getCorsHeaders(req) });
    }

    // 2. Parse Payload
    const { shopId, messages, userTimezone, pageContext } = await req.json();

    // 3. Strict Input Validation (Prevent injection / huge payloads)
    if (!shopId || typeof shopId !== 'string' || shopId.length > 100) {
      return NextResponse.json({ error: 'Invalid shopId' }, { status: 400, headers: getCorsHeaders(req) });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages payload' }, { status: 400, headers: getCorsHeaders(req) });
    }

    // Restrict history size to the last 20 messages to prevent prompt stuffing
    const truncatedMessages = messages.slice(-20);
    const formattedContents: any[] = truncatedMessages.map((m: any) => {
      if (m.parts) {
        return m; // Use raw Gemini format
      }
      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: String(m.content || '').substring(0, 500) }]
      };
    });

    // 4. Resolve shop
    const shop = await resolveShop(shopId);
    if (!shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404, headers: getCorsHeaders(req) });
    }

    // IMPORTANT: Use the actual database ID going forward
    const realShopId = shop.id;
    const c = (shop.customization as any) || {};
    const configuredWebsite = c.contact?.website || c.website || '';

    // 5. Origin Validation (CORS Hardening)
    if (!isOriginAllowedForShop(req, shop, shopId, configuredWebsite)) {
      const originHeader = req.headers.get('origin') || '';
      const refererHeader = req.headers.get('referer') || '';
      logger.warn(`Unauthorized origin attempt: ${originHeader || refererHeader} (referer: ${refererHeader}) for shop: ${shopId}`);
      return NextResponse.json({ error: 'Unauthorized origin' }, { status: 403, headers: getCorsHeaders(req) });
    }

    // 6. Fetch shop data for system prompt
    const [services, staff, addons, products, loyaltyProgram, reviewStats] = await Promise.all([
      prisma.service.findMany({ where: { shopId: realShopId, type: 'CUSTOMER', isBookable: true }, select: { id: true, name: true, description: true, price: true, duration: true } }),
      prisma.user.findMany({ where: { shopId: realShopId, role: { in: ['STAFF', 'SHOP_ADMIN', 'BOOTH_RENTER'] } }, select: { id: true, name: true, role: true } }),
      prisma.serviceAddon.findMany({ where: { shopId: realShopId }, select: { name: true, price: true, durationMin: true } }),
      prisma.product.findMany({ where: { shopId: realShopId, type: 'RETAIL', isSellable: true }, select: { name: true, description: true, price: true } }),
      prisma.loyaltyProgram.findFirst({ where: { shopId: realShopId, isActive: true }, select: { pointsPerDollar: true, pointsPerVisit: true, redeemThreshold: true, redeemValue: true } }),
      prisma.review.aggregate({ where: { shopId: realShopId }, _avg: { rating: true }, _count: { id: true } }),
    ]);

    const shopTz = shop.timezone || 'America/New_York';
    const effectiveTz = userTimezone || shopTz;
    const userDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: effectiveTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());

    const refererHeader = req.headers.get('referer') || '';

    // 7. Build system instruction
    const systemInstruction = buildSystemInstruction({
      shop, services, staff, addons, products, loyaltyProgram, reviewStats,
      userDateStr, refererHeader, pageContext,
    });

    // 8. Call Gemini
    let response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: formattedContents,
      config: {
        systemInstruction,
        tools: [{ functionDeclarations: allToolDeclarations }],
      }
    });

    // Extract text from response
    let finalResponseText = "";
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (typeof part.text === 'string' && !part.thought) {
          finalResponseText += part.text;
        }
      }
    }

    // 9. Tool call loop
    let functionCalls = response.functionCalls;
    let loopCount = 0;

    let lastUiType: string | null = null;
    let lastAvailabilitySlots = null;
    let lastAvailabilityDate = null;
    let lastQrCodeUrl: string | null = null;

    const toolCtx: ToolHandlerContext = { prisma, shop, realShopId, customization: c };

    while (functionCalls && functionCalls.length > 0 && loopCount < 5) {
      loopCount++;
      const toolResponses = [];

      for (const call of functionCalls) {
        let handlerResult: ToolHandlerResult;
        try {
          switch (call.name) {
            case 'check_availability':
              handlerResult = await handleCheckAvailability(call.args as any, toolCtx);
              break;
            case 'book_appointment':
              handlerResult = await handleBookAppointment(call.args as any, toolCtx);
              break;
            case 'check_appointments':
              handlerResult = await handleCheckAppointments(call.args as any, toolCtx);
              break;
            case 'send_calendar_invite':
              handlerResult = await handleSendCalendarInvite(call.args as any, toolCtx);
              break;
            case 'cancel_appointment':
              handlerResult = await handleCancelAppointment(call.args as any, toolCtx);
              break;
            case 'reschedule_appointment':
              handlerResult = await handleRescheduleAppointment(call.args as any, toolCtx);
              break;
            default:
              handlerResult = { result: { error: `Unknown tool: ${call.name}` } };
          }
        } catch (err: any) {
          logger.error("Tool execution error:", err);
          handlerResult = { result: { error: err.message } };
        }

        // Merge UI metadata from handler result
        if (handlerResult.uiType) lastUiType = handlerResult.uiType;
        if (handlerResult.availabilitySlots) lastAvailabilitySlots = handlerResult.availabilitySlots;
        if (handlerResult.availabilityDate) lastAvailabilityDate = handlerResult.availabilityDate;
        if (handlerResult.qrCodeUrl) lastQrCodeUrl = handlerResult.qrCodeUrl;

        toolResponses.push({
          functionResponse: {
            name: call.name,
            response: handlerResult.result
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

      // Use the proper role for tool responses
      formattedContents.push(
        { role: 'user', parts: toolResponses }
      );

      response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: formattedContents,
        config: {
          systemInstruction,
          tools: [{ functionDeclarations: allToolDeclarations }],
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

    // 10. Sanitize LLM output to prevent reflected XSS
    finalResponseText = finalResponseText.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // CRITICAL: Append the model's final response to the history
    if (finalResponseText) {
      formattedContents.push({
        role: 'model',
        parts: [{ text: finalResponseText }]
      });
    }

    // Strip function call/response/thought parts — only keep text-based messages
    const cleanHistory = formattedContents
      .map((msg: any) => {
        if (!msg.parts) return msg;
        const textParts = msg.parts.filter((p: any) => typeof p.text === 'string' && !p.thought && !p.functionCall && !p.functionResponse);
        if (textParts.length === 0) return null;
        return { role: msg.role, parts: textParts };
      })
      .filter(Boolean);

    // 11. Build response payload with optional UI metadata
    const payload: any = { text: finalResponseText, history: cleanHistory };
    if (lastUiType === 'date_picker') {
      payload.ui = { type: 'date_picker' };
    } else if (lastUiType === 'time_picker' && lastAvailabilitySlots) {
      payload.ui = { type: 'time_picker', date: lastAvailabilityDate, slots: lastAvailabilitySlots };
    } else if (lastUiType === 'qr_code' && lastQrCodeUrl) {
      payload.ui = { type: 'qr_code', qrCodeUrl: lastQrCodeUrl };
    }

    return NextResponse.json(payload, { headers: getCorsHeaders(req) });
  } catch (error: any) {
    logger.error("Chat API error:", error);
    // Graceful fallback for Gemini API or internal failures
    const fallbackPayload = {
      text: "I am currently experiencing high traffic and cannot process messages right now. Please use our [Standard Booking System](/book) to schedule your appointment.",
      history: []
    };
    return NextResponse.json(fallbackPayload, { status: 200, headers: getCorsHeaders(req) });
  }
}
