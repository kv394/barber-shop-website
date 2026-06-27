import { NextResponse } from 'next/server';
import { prisma, getTenantClient } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';
import { VertexAI } from '@google-cloud/vertexai';

export const dynamic = 'force-dynamic';

const vertex_ai = new VertexAI({
  project: 'igneous-etching-492302-v7', 
  location: 'us-central1'
});

const generativeModel = vertex_ai.preview.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.7,
  },
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
    const authResult = await requireShopRole(shopId, ['SHOP_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const { imageId, imageUrl, shopName, shopLocation } = await request.json();

    if (!imageId || !imageUrl) {
      return NextResponse.json({ error: 'Image ID and URL are required' }, { status: 400 });
    }

    // Validate shop has enough tokens
    const shop = await tenantClient.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    
    if (shop.aiTokens < 1) {
      return NextResponse.json({ error: 'Insufficient AI tokens.' }, { status: 403 });
    }

    // Let's attempt to fetch the image buffer to do real vision
    let imagePart = null;
    try {
      const imageResp = await fetch(imageUrl);
      if (imageResp.ok) {
        const arrayBuffer = await imageResp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        imagePart = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: imageResp.headers.get("content-type") || "image/jpeg"
          }
        };
      }
    } catch (e) {
      console.error("Failed to fetch image for AI vision", e);
    }

    const promptText = `You are an expert Social Media Manager for a high-end salon/barbershop named "${shopName}" located in ${shopLocation || 'the city'}. 
Please write a short, highly engaging Instagram/TikTok caption for this portfolio image. 
${imagePart ? 'Carefully analyze the haircut, style, and details in the image to make the caption highly specific and relevant to the actual work shown.' : ''}
Include 5-7 relevant hashtags. Do not use quotes around the caption. Use appropriate emojis. 
Make it punchy and designed to attract new clients to book an appointment.`;

    const requestParts: any[] = [{ text: promptText }];
    if (imagePart) {
      requestParts.push(imagePart);
    }

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: requestParts }]
    });
    const generatedCaption = result.response.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedCaption) {
      throw new Error("No caption generated from AI");
    }

    // Deduct 1 AI Token
    const updatedShop = await tenantClient.shop.update({
      where: { id: shopId },
      data: { aiTokens: { decrement: 1 } }
    });

    return NextResponse.json({ 
      success: true, 
      caption: generatedCaption,
      remainingTokens: updatedShop.aiTokens 
    });

  } catch (error) {
    console.error('Error generating social media caption:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
