import { NextRequest, NextResponse } from 'next/server';
import { requireShopRole, isAuthError } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const auth = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(auth)) return auth;

  // Get global templates AND shop-specific templates
  const templates = await prisma.dynamicTemplate.findMany({
    where: {
      OR: [
        { shopId: null },
        { shopId: shopId }
      ]
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(templates);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = await params;
  const auth = await requireShopRole(shopId, ['SUPER_ADMIN', 'SHOP_ADMIN']);
  if (isAuthError(auth)) return auth;

  const { prompt, name, description, model } = await request.json();

  if (!prompt || !name) {
    return NextResponse.json({ error: 'Missing prompt or name' }, { status: 400 });
  }

  // Ensure unique name across the whole DB
  const existing = await prisma.dynamicTemplate.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: 'A template with this name already exists.' }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const selectedModel = model || 'gemini-2.5-flash';

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
      contents: `Design a unique, fully responsive layout using Tailwind CSS utility classes based on the following request:

USER PROMPT:
"${prompt}"

Use the following handlebars-like placeholders for dynamic data injection:
{{shop.name}}
{{shop.description}}
{{primaryColor}}
{{secondaryColor}}
{{#each shop.services}}
  {{this.id}} (Use this in a data-service-id attribute on booking buttons/links)
  {{this.name}}
  {{this.description}}
  {{this.price}}
  {{this.duration}}
{{/each}}`,
      config: {
        systemInstruction: `You are a world-class, avant-garde web designer and frontend developer.
Your ONLY goal is to generate heavily customized, extremely unique, and visually stunning web templates that strictly adhere to the user's specific theme and request.
DO NOT use generic, standard, or "modern boilerplate" layouts unless explicitly asked.
Use creative spacing, dramatic typography, intricate Tailwind CSS classes, unique grid/flexbox arrangements, and elaborate structural designs.
Return your response as a valid JSON object matching exactly this schema:
{
  "htmlCode": "<html structure using semantic HTML5 and Tailwind CSS>",
  "cssCode": "<any custom css like animations, font imports, or complex gradients>"
}`,
        temperature: 1.3,
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '{}';
    const result = JSON.parse(text);

    const template = await prisma.dynamicTemplate.create({
      data: {
        name,
        description,
        prompt,
        htmlCode: result.htmlCode,
        cssCode: result.cssCode || '',
        shopId: shopId, // Associate it with the shop
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
