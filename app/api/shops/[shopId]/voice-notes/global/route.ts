import { NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { GoogleGenAI } from '@google/genai';
import { prisma } from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SITE_ADMIN', 'SHOP_ADMIN', 'STAFF']);
    if (isAuthError(authResult)) return authResult;

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());

    const MAX_VOICE_NOTE_SIZE = 5 * 1024 * 1024; // 5MB
    if (buffer.byteLength > MAX_VOICE_NOTE_SIZE) {
      return NextResponse.json({ error: 'Voice note size exceeds 5MB limit' }, { status: 413 });
    }

    const base64Audio = buffer.toString('base64');
    const mimeType = audioFile.type || 'audio/webm';

    const prompt = `You are an expert AI assistant for barbers. You are listening to a "quick voice command" recorded by a barber. 
Your first and most important job is to determine the INTENT of the command and extract the NAME of the client the barber is talking about.
Intents can be:
- "navigate": The barber wants to open or go to a client's profile (e.g., "Open John's profile", "Show me Mike Chen", "Navigate to Alex").
- "note": The barber wants to record a note, style, or formula for a client (e.g., "For John, we did a skin fade", "Mike used matte clay today").

Then, extract the key details into a structured JSON format.
Focus on:
1. "intent": Either "navigate" or "note".
2. "clientNameGuess": The name of the client mentioned (e.g., "John", "Mike Chen"). If no name is mentioned, return null.
3. "style": The haircut style or instructions (only if intent is "note").
4. "products": Any products used or recommended (only if intent is "note").
5. "preferences": Any other preferences or notes (only if intent is "note").
6. "rawTranscript": The raw transcribed text.

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

    if (!parsed.clientNameGuess) {
        return NextResponse.json({ error: "Could not identify a client name from the audio. Please specify the client name clearly." }, { status: 400 });
    }

    // Try to find the client in the database
    // Split the guess into parts if it has multiple words to do a flexible search
    const searchTerms = parsed.clientNameGuess.trim().split(' ').filter(Boolean);
    const OR_conditions = searchTerms.map((term: string) => ({
        name: { contains: term, mode: 'insensitive' as any }
    }));

    const possibleClients = await prisma.user.findMany({
        where: { 
            shopId, 
            role: 'CLIENT',
            ...(OR_conditions.length > 0 ? { OR: OR_conditions } : {})
        },
        include: { shopClients: { where: { shopId } } },
        take: 5
    });

    if (possibleClients.length === 0) {
        return NextResponse.json({ 
            error: `Could not find any client matching the name "${parsed.clientNameGuess}" in your shop. Transcript: "${parsed.rawTranscript}"` 
        }, { status: 404 });
    }

    // Just take the best match (the first one)
    const targetClient = possibleClients[0];

    const intent = parsed.intent === 'navigate' ? 'navigate' : 'note';

    if (intent === 'navigate') {
        return NextResponse.json({ 
            success: true, 
            intent: 'navigate',
            matchedClientName: targetClient.name,
            clientId: targetClient.id,
            parsed 
        });
    }

    // Combine into a neat text block for the general notes field
    let newNoteBlock = `--- Voice Note (${new Date().toLocaleDateString()}) ---\n`;
    if (parsed.style) newNoteBlock += `Style: ${parsed.style}\n`;
    if (parsed.products) newNoteBlock += `Products: ${parsed.products}\n`;
    if (parsed.preferences) newNoteBlock += `Preferences: ${parsed.preferences}\n`;
    newNoteBlock += `Transcript: "${parsed.rawTranscript || '...'}"\n\n`;

    const targetShopClient = targetClient.shopClients?.[0] || {};
    const newClientNotes = newNoteBlock + (targetShopClient.clientNotes || '');
    const newPreferences = parsed.preferences && !targetShopClient.preferences ? parsed.preferences : targetShopClient.preferences;

    await prisma.shopClient.upsert({
        where: { userId_shopId: { userId: targetClient.id, shopId } },
        create: {
            userId: targetClient.id,
            shopId,
            clientNotes: newClientNotes,
            preferences: newPreferences
        },
        update: {
            clientNotes: newClientNotes,
            preferences: newPreferences
        }
    });

    return NextResponse.json({ 
        success: true, 
        matchedClientName: targetClient.name,
        parsed 
    });
  } catch (err: any) {
    logger.error('Global Voice Note Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}