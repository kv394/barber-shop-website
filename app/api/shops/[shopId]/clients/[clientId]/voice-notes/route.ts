import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string, clientId: string }> }
) {
 try {
 const { shopId, clientId } = await params;
 const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
 if (isAuthError(authResult)) return authResult;

 const formData = await request.formData();
 const audioFile = formData.get('audio') as File;
 if (!audioFile) {
 return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
 }

 const buffer = Buffer.from(await audioFile.arrayBuffer());
 
 // Upload the file to Gemini API using Files API (in-memory parts is better for small snippets)
 const base64Audio = buffer.toString('base64');
 const mimeType = audioFile.type || 'audio/webm';

 const prompt = `You are an expert AI assistant for barbers. You are listening to a voice memo recorded by a barber immediately after finishing a client's haircut. 
Your job is to transcribe the memo and extract key details into a structured JSON format.
Focus on:
1. "style": The haircut style or instructions (e.g. "High Skin Fade", "Trim top by 1 inch")
2. "products": Any products used or recommended (e.g. "Matte Clay")
3. "preferences": Any other preferences or notes (e.g. "Talkative", "Allergic to X")
4. "rawTranscript": The raw transcribed text.

Return strictly a JSON object with these keys. If a key is not mentioned, omit it or leave it null.`;

 const response = await ai.models.generateContent({
 model: 'gemini-2.5-flash',
 contents: [
 {
 role: 'user',
 parts: [
 { text: prompt },
 { inlineData: { mimeType, data: base64Audio } }
 ]
 }
 ],
 config: {
 responseMimeType: 'application/json',
 }
 });

 const resultText = response.candidates?.[0]?.content?.parts?.[0]?.text;
 if (!resultText) throw new Error("No response from AI");

 const parsed = JSON.parse(resultText);
 
 // Combine into a neat text block for the general notes field
 let newNoteBlock = `--- Voice Note (${new Date().toLocaleDateString()}) ---\n`;
 if (parsed.style) newNoteBlock += `Style: ${parsed.style}\n`;
 if (parsed.products) newNoteBlock += `Products: ${parsed.products}\n`;
 if (parsed.preferences) newNoteBlock += `Preferences: ${parsed.preferences}\n`;
 newNoteBlock += `Transcript: "${parsed.rawTranscript || '...'}"\n\n`;

 return NextResponse.json({ success: true, parsed, newNoteBlock });
 } catch (err: any) {
 logger.error('Voice to CRM Error:', err);
 return NextResponse.json({ error: err.message }, { status: 500 });
 }
}
