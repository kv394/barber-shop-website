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

  const { prompt, name, description } = await request.json();

  if (!prompt || !name) {
    return NextResponse.json({ error: 'Missing prompt or name' }, { status: 400 });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `You are an expert web developer designing a highly customized and unique template for a barbershop.
DO NOT output a generic, plain, or "modern" boilerplate. Your goal is to strictly follow the "User Prompt" below and create a distinct, deeply customized aesthetic (layout, colors, typography, shapes, and structural design) that exactly matches their request.

The template must be responsive and visually stunning, heavily utilizing Tailwind CSS utility classes.
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
{{/each}}

User Prompt: ${prompt}

Respond ONLY with a JSON object with the following structure:
{
  "htmlCode": "The HTML markup here. Use Tailwind CSS classes for styling. Do not include html/head/body tags. Use semantic HTML5.",
  "cssCode": "Any additional custom CSS rules (e.g. keyframes, complex gradients, or font imports). Do not include style tags."
}`,
    });

    const text = response.text || '';
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(jsonStr);

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
