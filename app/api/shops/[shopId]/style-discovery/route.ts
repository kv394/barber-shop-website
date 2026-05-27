import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limiter';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;

 // Rate limit: 5 requests per IP per minute (client-facing, no auth required)
 const ip = request.headers.get('x-forwarded-for') || 'unknown';
 const rl = await rateLimit(`style-discovery:${ip}`, 5, 60);
 if (!rl.success) {
 return NextResponse.json(
 { error: 'Too many requests. Please try again in a minute.' },
 { status: 429 }
 );
 }

 const body = await request.json();
 const { imageBase64 } = body;

 if (!imageBase64 || typeof imageBase64 !== 'string') {
 return NextResponse.json(
 { error: 'Image is required. Please upload a selfie.' },
 { status: 400 }
 );
 }

 // Cap image size at 4MB base64 (~3MB raw)
 if (imageBase64.length > 4 * 1024 * 1024) {
 return NextResponse.json(
 { error: 'Image is too large. Please use a smaller photo.' },
 { status: 400 }
 );
 }

 // Verify shop exists
 const shop = await prisma.shop.findUnique({
 where: { id: shopId },
 select: { id: true, name: true },
 });

 if (!shop) {
 return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 }

 // Fetch portfolio images with captions for matching
 const portfolioImages = await prisma.portfolioImage.findMany({
 where: { shopId },
 select: {
 id: true,
 imageUrl: true,
 caption: true,
 staff: { select: { name: true } },
 },
 orderBy: { displayOrder: 'asc' },
 take: 30,
 });

 const portfolioCatalog = portfolioImages.length > 0
 ? portfolioImages
 .map((img: any, i: number) => `${i + 1}. "${img.caption || 'No caption'}" by ${img.staff?.name || 'Staff'} [ID: ${img.id}]`)
 .join('\n')
 : 'No portfolio images available.';

 // Strip data URL prefix if present
 const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

 const prompt = `You are a professional hairstylist AI assistant at "${shop.name}". A client has uploaded a selfie for style recommendations.

## TASK
1. Analyze the selfie: face shape, hair type/texture, current length, and any notable features
2. Based on your analysis, recommend 3 hairstyles that would suit this person
3. Match recommendations to the shop's portfolio if possible

## SHOP PORTFOLIO CATALOG
${portfolioCatalog}

## INSTRUCTIONS
Return a JSON object:
{
 "analysis": {
 "faceShape": "oval/round/square/heart/oblong/diamond",
 "hairType": "straight/wavy/curly/coily",
 "hairTexture": "fine/medium/thick",
 "currentLength": "buzz/short/medium/long",
 "notes": "Brief observation about their features (1 sentence)"
 },
 "recommendations": [
 {
 "styleName": "Name of the recommended style",
 "description": "Why this style suits them (1-2 sentences)",
 "portfolioImageId": "ID from the catalog if a match exists, or null",
 "confidence": "high/medium"
 }
 ]
}

Rules:
- Exactly 3 recommendations, sorted by best match first
- Be encouraging and positive in descriptions
- If portfolio images exist, try to match at least 1-2 recommendations to them
- If no portfolio images, recommend general styles based on analysis
- Keep descriptions under 100 characters
- Be realistic about what would look good based on face shape + hair type`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [
 {
 role: 'user',
 parts: [
 { text: prompt },
 {
 inlineData: {
 mimeType: 'image/jpeg',
 data: cleanBase64,
 },
 },
 ],
 },
 ],
 config: { responseMimeType: 'application/json' },
 });

 const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
 if (!resultText) throw new Error('No response from AI');

 const parsed = JSON.parse(resultText);

 // Enrich recommendations with portfolio image URLs
 const recommendations = (parsed.recommendations || []).map((rec: any) => {
 const portfolioMatch = rec.portfolioImageId
 ? portfolioImages.find((img: any) => img.id === rec.portfolioImageId)
 : null;
 return {
 ...rec,
 portfolioImageUrl: portfolioMatch?.imageUrl || null,
 portfolioCaption: portfolioMatch?.caption || null,
 artistName: portfolioMatch?.staff?.name || null,
 };
 });

 return NextResponse.json({
 analysis: parsed.analysis || {},
 recommendations,
 shopName: shop.name,
 generatedAt: new Date().toISOString(),
 });
 } catch (err: any) {
 logger.error('Style Discovery Error:', err);
 return NextResponse.json(
 { error: err.message || 'Failed to analyze style' },
 { status: 500 }
 );
 }
}
