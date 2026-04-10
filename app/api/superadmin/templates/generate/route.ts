import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

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

  const selectedModel = model || 'gemma2-9b-it';
  const isGroq = selectedModel.startsWith('gemma') || selectedModel.startsWith('llama') || selectedModel.startsWith('mixtral');
  
  const apiKey = isGroq ? process.env.GROQ_API_KEY : process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: `${isGroq ? 'GROQ_API_KEY' : 'GEMINI_API_KEY'} is not set` }, { status: 500 });
  }

  try {
    let result;

    const systemInstruction = `You are a world-class, avant-garde web designer and frontend developer.
Your ONLY goal is to generate heavily customized, extremely unique, and visually stunning web templates that strictly adhere to the user's specific theme and request.
DO NOT use generic, standard, or "modern boilerplate" layouts unless explicitly asked.
Use creative spacing, dramatic typography, intricate Tailwind CSS classes, unique grid/flexbox arrangements, and elaborate structural designs.
Return your response as a valid JSON object matching exactly this schema:
{
  "htmlCode": "<html structure using semantic HTML5 and Tailwind CSS>",
  "cssCode": "<any custom css like animations, font imports, or complex gradients>"
}`;

    const userPrompt = `Design a completely unique, fully responsive layout using Tailwind CSS utility classes based on the following request:

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
{{/each}}

OUTPUT ONLY VALID JSON.`;

    if (isGroq) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to generate template with Groq');
      
      const text = data.choices[0]?.message?.content || '{}';
      result = JSON.parse(text);
    } else {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 1.5,
            responseMimeType: 'application/json',
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate template with Gemini');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      result = JSON.parse(text);
    }

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
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
