import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { GoogleGenAI } from '@google/genai';

export const dynamic = 'force-dynamic';

async function requireSuperAdmin() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId && !authUserEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { id: true, role: true } });
  if (!user || user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireSuperAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const { prompt, name, description, model } = await request.json();

  if (!prompt || !name) {
    return NextResponse.json({ error: 'Missing prompt or name' }, { status: 400 });
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
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Gemini error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
