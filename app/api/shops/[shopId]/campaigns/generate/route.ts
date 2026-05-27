import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GOAL_PROMPTS: Record<string, string> = {
 WIN_BACK: 'The goal is to RE-ENGAGE inactive clients who haven\'t visited in a while. Create urgency and remind them what they\'re missing. Offer a compelling reason to come back (e.g., a discount, a new service, or a personal touch).',
 NEW_SERVICE: 'The goal is to PROMOTE a new service, deal, or special offering. Build excitement and curiosity. Highlight the value and make it feel exclusive or limited-time.',
 BIRTHDAY: 'The goal is to send a warm, personal BIRTHDAY message. Make the client feel special and valued. Include a birthday treat or discount as a gift from the shop.',
 ANNOUNCEMENT: 'The goal is to make a GENERAL ANNOUNCEMENT (new hours, new staff, holiday closures, etc.). Keep it informative but on-brand and engaging.',
 CUSTOM: 'The goal is described in the custom prompt below. Follow the user\'s intent closely.',
};

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 const body = await request.json();
 const { goal, channel, targetSegment, customPrompt } = body;

 if (!goal) {
 return NextResponse.json({ error: 'A campaign goal is required' }, { status: 400 });
 }

 // Fetch shop context
 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { name: true, slogan: true },
 });

 if (!shop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 }

 const services = await prisma.service.findMany({
 where: { shopId, type: 'CUSTOMER' },
 select: { name: true, price: true, description: true },
 take: 20,
 orderBy: { name: 'asc' },
 });

 // Build the service menu string
 const serviceMenu = services.length > 0
 ? services.map((s: { name: string; price: number; description: string | null }) => `- ${s.name} ($${s.price})${s.description ? `: ${s.description}` : ''}`).join('\n')
 : 'No services listed yet.';

 const segmentContext: Record<string, string> = {
 ALL: 'all clients of the shop',
 INACTIVE_30: 'clients who haven\'t visited in 30+ days',
 INACTIVE_60: 'clients who haven\'t visited in 60+ days',
 INACTIVE_90: 'clients who haven\'t visited in 90+ days',
 BIRTHDAY_THIS_MONTH: 'clients whose birthday is this month',
 };

 const channelInstructions = channel === 'SMS'
 ? 'Generate ONLY SMS copy. SMS must be under 155 characters (save 5 for merge tags). Be punchy and direct.'
 : channel === 'BOTH'
 ? 'Generate BOTH an SMS version (under 155 characters) and a longer Email version. The email should have a subject line and body.'
 : 'Generate ONLY Email copy with a compelling subject line and a body with a clear call-to-action.';

 const goalPrompt = GOAL_PROMPTS[goal] || GOAL_PROMPTS.CUSTOM;
 const customContext = goal === 'CUSTOM' && customPrompt
 ? `\n\nThe shop owner's custom instructions: "${String(customPrompt).slice(0, 500)}"`
 : '';

 const prompt = `You are an expert marketing copywriter for barber shops and salons. You write copy that is warm, authentic, and matches the shop's personality.

## SHOP CONTEXT
- Shop Name: ${shop.name}
- Slogan: ${shop.slogan || 'None set'}
- Service Menu:
${serviceMenu}

## TARGET AUDIENCE
This campaign targets: ${segmentContext[targetSegment] || 'all clients'}.

## CAMPAIGN GOAL
${goalPrompt}${customContext}

## CHANNEL
${channelInstructions}

## INSTRUCTIONS
Generate exactly 3 different variations of campaign copy. Each variation should have a distinct tone:
1. **Casual & Friendly** — Conversational, warm, uses emojis sparingly
2. **Professional & Clean** — Polished, trustworthy, no emojis
3. **Bold & Playful** — Energetic, attention-grabbing, creative with language

For each variation, use the merge tag {CLIENT_NAME} where you would personalize with the client's first name.

Return a JSON object with this exact structure:
{
 "variations": [
 {
 "tone": "casual",
 "toneLabel": "Casual & Friendly",
 "campaignName": "Short internal campaign name",
 "smsBody": "SMS text under 155 chars (only if SMS or BOTH channel)",
 "emailSubject": "Email subject line (only if EMAIL or BOTH channel)",
 "emailBody": "Email body text with CTA (only if EMAIL or BOTH channel)"
 }
 ]
}

Only include smsBody for SMS/BOTH channels. Only include emailSubject/emailBody for EMAIL/BOTH channels.`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [
 {
 role: 'user',
 parts: [{ text: prompt }],
 },
 ],
 config: {
 responseMimeType: 'application/json',
 },
 });

 const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
 if (!resultText) {
 throw new Error('No response from AI');
 }

 const parsed = JSON.parse(resultText);

 if (!parsed.variations || !Array.isArray(parsed.variations) || parsed.variations.length === 0) {
 throw new Error('AI returned invalid format');
 }

 return NextResponse.json({
 success: true,
 variations: parsed.variations,
 shopContext: {
 name: shop.name,
 slogan: shop.slogan,
 serviceCount: services.length,
 },
 });
 } catch (err: any) {
 logger.error('Campaign AI Generation Error:', err);
 return NextResponse.json(
 { error: err.message || 'Failed to generate campaign copy' },
 { status: 500 }
 );
 }
}
