import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireShopRole } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const { shopId } = await params;
    const authResult = await requireShopRole(shopId, ['SHOP_ADMIN', 'SITE_ADMIN']);
    if (authResult instanceof NextResponse) return authResult;

    const { imageId, imageUrl, shopName, shopLocation } = await request.json();

    if (!imageId || !imageUrl) {
      return NextResponse.json({ error: 'Image ID and URL are required' }, { status: 400 });
    }

    // Validate shop has enough tokens
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    
    if (shop.aiTokens < 1) {
      return NextResponse.json({ error: 'Insufficient AI tokens.' }, { status: 403 });
    }

    // Initialize Gemini API
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'AI features are not configured properly.' }, { status: 500 });
    }
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Since passing image bytes from an external URL to Gemini requires fetching it server-side, 
    // for MVP we will use the image's existing caption or just generate a generic amazing caption
    // based on the shop name. (To do true vision, we'd fetch the image buffer here and pass it as base64).
    
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
Include 5-7 relevant hashtags. Do not use quotes around the caption. Use appropriate emojis. 
Make it punchy and designed to attract new clients to book an appointment.`;

    const requestParts: any[] = [promptText];
    if (imagePart) {
      requestParts.push(imagePart);
    }

    const result = await model.generateContent(requestParts);
    const generatedCaption = result.response.text();

    // Deduct 1 AI Token
    const updatedShop = await prisma.shop.update({
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
