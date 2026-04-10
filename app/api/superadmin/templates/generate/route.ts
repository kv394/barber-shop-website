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

    const systemInstruction = `You are an expert frontend developer and web designer.
Your task is to generate a highly customized, fully responsive web template using HTML5 and Tailwind CSS based on the user's prompt.
You MUST strictly adhere to the following rules:
1. Output ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
2. The JSON object must have exactly two keys: "htmlCode" and "cssCode".
3. The "htmlCode" must contain the full HTML structure (assume it will be placed inside a <body> tag, provide the main wrapper divs).
4. The "cssCode" should contain any custom CSS (e.g., @import fonts, custom animations). Leave as empty string if not needed.
5. You MUST use the exact Handlebars placeholders provided by the user for dynamic data. Do not invent new placeholders.
6. Make the design visually stunning, modern, and tailored to the user's specific request.`;

    const userPrompt = `Create a stunning, responsive Tailwind CSS template for a barbershop/salon based on this request:
"${prompt}"

REQUIRED PLACEHOLDERS to use in your HTML:
- {{shop.name}} : The name of the shop (use in headers/hero)
- {{shop.description}} : The description of the shop
- {{primaryColor}} : Use as an inline style or Tailwind arbitrary value if needed (e.g. style="color: {{primaryColor}}")
- {{secondaryColor}} : Use as an inline style or Tailwind arbitrary value if needed

SERVICES LOOP:
You must iterate over the services to display them (e.g., in a grid or list).
{{#each shop.services}}
  <div class="service-card-example ...">
     <h3>{{this.name}}</h3>
     <p>{{this.description}}</p>
     <span>\${{this.price}}</span>
     <span>{{this.duration}} mins</span>
     <button data-service-id="{{this.id}}">Book Now</button>
  </div>
{{/each}}

Output ONLY the raw, valid JSON object matching the schema { "htmlCode": "...", "cssCode": "..." }. No markdown blocks.`;

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
          temperature: 0.4,
          response_format: { type: "json_object" }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Failed to generate template with Groq');
      
      const text = data.choices[0]?.message?.content || '{}';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanText);
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
            temperature: 0.7,
            responseMimeType: 'application/json',
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to generate template with Gemini');
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      result = JSON.parse(cleanText);
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
