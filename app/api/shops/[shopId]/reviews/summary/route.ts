import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma, getTenantClient } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function GET(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId: paramShopId } = await params; const resolvedShop = await prisma.shop.findFirst({
 where: {
 OR: [
 { id: paramShopId },
 { subdomain: paramShopId },
 { customDomain: paramShopId },
 { name: { equals: paramShopId.replace(/-/g, ' '), mode: 'insensitive' } }
 ]
 },
 select: { id: true }
 });

 if (!resolvedShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
 const shopId = resolvedShop.id;

 const tenantClient = await getTenantClient(shopId);

 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN']);
 if (isAuthError(authResult)) return authResult;

 // Fetch reviews (last 100, sorted newest first)
 const reviews = await tenantClient.review.findMany({
 where: { shopId },
 orderBy: { createdAt: 'desc' },
 take: 100,
 select: {
 rating: true,
 comment: true,
 createdAt: true,
 },
 });

 if (reviews.length === 0) {
 return NextResponse.json({
 bullets: [],
 sentiment: 'neutral',
 avgRating: 0,
 reviewCount: 0,
 message: 'No reviews to summarize yet.',
 });
 }

 // Compute basic stats
 const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;
 const reviewsWithComments = reviews.filter((r: { comment: string | null }) => r.comment && r.comment.trim().length > 0);

 if (reviewsWithComments.length < 3) {
 // Not enough text reviews for a meaningful summary
 return NextResponse.json({
 bullets: [],
 sentiment: avgRating >= 4 ? 'positive' : avgRating >= 3 ? 'mixed' : 'negative',
 avgRating: Math.round(avgRating * 10) / 10,
 reviewCount: reviews.length,
 message: 'Not enough written reviews for an AI summary yet.',
 });
 }

 // Build review text for Gemini
 const reviewText = reviewsWithComments
 .slice(0, 50) // Cap at 50 reviews to keep prompt manageable
 .map((r: { rating: number; comment: string | null }, i: number) => `Review ${i + 1} (${r.rating}★): ${r.comment}`)
 .join('\n');

 const prompt = `You are analyzing customer reviews for a barbershop/salon. Summarize the overall sentiment and key themes.

## REVIEWS (${reviewsWithComments.length} with comments, ${reviews.length} total, avg rating: ${avgRating.toFixed(1)}★)
${reviewText}

## INSTRUCTIONS
Generate a concise summary as JSON:
{
 "bullets": [
 "First key insight about what customers love or mention most",
 "Second key theme or pattern across reviews",
 "Third observation — could be an area for improvement or a standout strength"
 ],
 "sentiment": "positive" | "mixed" | "negative",
 "topStrengths": ["strength1", "strength2"],
 "topImprovements": ["area1"]
}

Rules:
- Exactly 3 bullets, each under 80 characters
- bullets should be insightful, specific, and actionable — not generic
- "positive" if avg ≥ 4.0 and most comments are praise
- "mixed" if avg is 3.0–3.9 or reviews are polarized
- "negative" if avg < 3.0 or majority complain
- topStrengths: 1-2 most praised aspects
- topImprovements: 0-1 areas mentioned for improvement (empty array if none)
- Write from the perspective of summarizing for the shop owner`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [{ role: 'user', parts: [{ text: prompt }] }],
 config: { responseMimeType: 'application/json' },
 });

 const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
 if (!resultText) throw new Error('No response from AI');

 const parsed = JSON.parse(resultText);

 return NextResponse.json({
 bullets: parsed.bullets || [],
 sentiment: parsed.sentiment || 'mixed',
 topStrengths: parsed.topStrengths || [],
 topImprovements: parsed.topImprovements || [],
 avgRating: Math.round(avgRating * 10) / 10,
 reviewCount: reviews.length,
 generatedAt: new Date().toISOString(),
 });
 } catch (err: any) {
 logger.error('Review Summary Error:', err);
 return NextResponse.json(
 { error: err.message || 'Failed to generate summary' },
 { status: 500 }
 );
 }
}
