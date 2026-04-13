import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { uploadFileToPath } from '@/lib/google-drive';
import AdmZip from 'adm-zip';

export const dynamic = 'force-dynamic';

async function requireSiteAdmin() {
  const supabase = await createClient();
  const { data: { user: authUserSession } } = await supabase.auth.getUser();
  let userId = authUserSession?.id;
  const authUserEmail = authUserSession?.email;
  if (!userId && !authUserEmail) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] }, select: { id: true, role: true } });
  if (!user || user.role !== 'SITE_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return user;
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireSiteAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const formData = await request.formData();
  const prompt = formData.get('prompt') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const model = formData.get('model') as string;
  const baseTemplateId = formData.get('baseTemplateId') as string;
  const targetShopId = formData.get('targetShopId') as string;
  const files = formData.getAll('files') as File[];

  if (!prompt || !name) {
    return NextResponse.json({ error: 'Missing prompt or name' }, { status: 400 });
  }

  if (!targetShopId) {
    return NextResponse.json({ error: 'Missing targetShopId' }, { status: 400 });
  }

  const FOLDER_PATH = `/barbersaas/${targetShopId}/${name}`;
  const uploadedAssets: { fileName: string; url: string }[] = [];
  let uploadedHtml = '';
  let uploadedCss = '';

  if (files && files.length > 0) {
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.endsWith('.zip')) {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();

        for (const zipEntry of zipEntries) {
          if (zipEntry.isDirectory) continue;
          
          const entryName = zipEntry.name;
          const entryBuffer = zipEntry.getData();

          if (entryName.endsWith('.html') || entryName.endsWith('.htm')) {
            uploadedHtml = entryBuffer.toString('utf-8');
          } else if (entryName.endsWith('.css')) {
            uploadedCss = entryBuffer.toString('utf-8');
          } else {
             const ext = entryName.split('.').pop()?.toLowerCase() || '';
             let mimeType = 'application/octet-stream';
             if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
             else if (ext === 'png') mimeType = 'image/png';
             else if (ext === 'gif') mimeType = 'image/gif';
             else if (ext === 'svg') mimeType = 'image/svg+xml';
             else if (ext === 'webp') mimeType = 'image/webp';
             
             const fileId = await uploadFileToPath(FOLDER_PATH, entryName, mimeType, entryBuffer);
             if (fileId) {
               uploadedAssets.push({ fileName: entryName, url: `/api/assets/${fileId}` });
             }
          }
        }
      } else {
        if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
          uploadedHtml = buffer.toString('utf-8');
        } else if (file.name.endsWith('.css')) {
          uploadedCss = buffer.toString('utf-8');
        } else {
          const fileId = await uploadFileToPath(FOLDER_PATH, file.name, file.type, buffer);
          if (fileId) {
            uploadedAssets.push({ fileName: file.name, url: `/api/assets/${fileId}` });
          }
        }
      }
    }
  }

  let shopContextStr = '';
  let shopName = 'a barbershop/salon';
  if (targetShopId) {
    const shop = await prisma.shop.findUnique({
      where: { id: targetShopId },
      include: {
        services: { select: { id: true, name: true, description: true, price: true, duration: true } },
        products: { select: { id: true, name: true, description: true, price: true } },
        users: { 
          where: { role: { in: ['STAFF', 'SHOP_ADMIN'] } },
          select: { id: true, name: true, role: true }
        },
        reviews: {
          select: { id: true, rating: true, comment: true, user: { select: { name: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (shop) {
      shopName = shop.name;
      const c = shop.customization as any || {};
      const galleryImages = c.editorial?.galleryImages || [];
      shopContextStr = `
--- REAL SHOP DATA CONTEXT ---
The user has provided the following real data for the shop to help you design a more specific template.
Use these specific services, products, staff names, reviews, and contact details in your design where appropriate (as dummy data injected via Handlebars, or to inspire the design).

Shop Name: ${shop.name}
Shop Description: ${shop.description || 'N/A'}
Contact Phone: ${c.phone || 'N/A'}
Contact Email: ${c.email || 'N/A'}
Address: ${c.address?.street || ''} ${c.address?.city || ''} ${c.address?.state || ''} ${c.address?.zip || ''}
Social Links: ${JSON.stringify(c.socialLinks || {})}
About Us / Story: ${c.aboutUs || 'N/A'}

Services Available:
${shop.services.map(s => `- ${s.name}: $${s.price} (${s.duration} mins)`).join('\n')}

Products Available:
${shop.products.map(p => `- ${p.name}: $${p.price}`).join('\n')}

Staff Members:
${shop.users.map(u => `- ${u.name} (${u.role})`).join('\n')}

Reviews:
${shop.reviews.map(r => `- ${r.user?.name || 'Anonymous'}: ${r.rating} stars - "${r.comment || ''}"`).join('\n')}

Gallery Images Available:
${galleryImages.length > 0 ? galleryImages.map((g: string) => `- ${g}`).join('\n') : 'N/A'}

Custom Pages/Sections Configured:
${JSON.stringify(c.customPages || [])}
------------------------------
`;
    }
  }

  let baseHtml = uploadedHtml;
  let baseCss = uploadedCss;

  // Replace local asset paths with their generated /api/assets/ URLs
  if (uploadedAssets.length > 0) {
    for (const asset of uploadedAssets) {
      if (baseHtml) {
        const regex = new RegExp(asset.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        baseHtml = baseHtml.replace(regex, asset.url);
      }
      if (baseCss) {
        const regex = new RegExp(asset.fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        baseCss = baseCss.replace(regex, asset.url);
      }
    }
  }

  if (!baseHtml && baseTemplateId) {
    const baseTemplate = await prisma.dynamicTemplate.findUnique({
      where: { id: baseTemplateId }
    });
    if (baseTemplate) {
      baseHtml = baseTemplate.htmlCode;
      baseCss = baseTemplate.cssCode || '';
    }
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
3. The "htmlCode" must contain the full HTML structure (assume it will be placed inside a <body> tag, provide the main wrapper divs). Do NOT include <html>, <head>, or <script> tags. React will not execute scripts.
4. The "cssCode" should contain any custom CSS (e.g., @import fonts, custom animations). Leave as empty string if not needed. Move any Google Fonts <link> tags from the base template into @import statements here.
5. You MUST use the exact Handlebars placeholders provided by the user for dynamic data. Do NOT invent new placeholders, and do NOT use Handlebars filters, pipes, or logic (e.g., NO \`{{primaryColor | default '#000'}}\` or \`{{#if}}\` unless explicitly provided in loops). ONLY use raw variable names like \`{{primaryColor}}\`.
6. Make the design visually stunning, modern, and tailored to the user's specific request.
7. TAILWIND CONSTRAINT (STITCH TEMPLATES): You are injecting into an existing Next.js app. Do NOT rely on custom Tailwind configs or \`<script id="tailwind-config">\`. If the base template is a "Stitch Template", it relies on custom semantic colors like \`bg-surface\`, \`text-on-surface\`, \`bg-primary\`, \`text-secondary\`, \`bg-tertiary-container\`, etc. You MUST exhaustively find and replace ALL of these custom semantic classes with standard Tailwind utility classes (e.g., \`bg-zinc-950\`, \`text-emerald-400\`) or arbitrary values (e.g., \`bg-[#121412]\`) that match the user's requested theme. Do NOT leave any custom Stitch classes behind!`;

    let userPrompt = `Create a stunning, responsive, and lively Tailwind CSS template for ${shopName} (a barbershop/salon landing page) based on this request:
"${prompt}"

CRITICAL REQUIREMENTS FOR THE SITE STRUCTURE:
- The site MUST be a single-page website layout.
- The navigation MUST include a Client Profile Icon that users can click to access their profile and functionalities.
- The site MUST ONLY have these specific sections (create different aesthetic variations for them as appropriate):
  1. About Us (use {{aboutUs}} placeholder and/or real context)
  2. Services (must allow selecting/booking MULTIPLE services directly from the landing page. Include a "Book Selected" button placeholder)
  3. Staff
  4. Customer Reviews
  5. Gallery (using shop's photo gallery)
- **Editable Content:** Use Handlebars variables for all headings, subheadings, and paragraphs (e.g., {{aboutUsTitle}}, {{servicesDescription}}, {{gallerySubtitle}}) so the shop admin can edit whatever text they want in the template edit page. Do not hardcode descriptive text if a placeholder can be used instead.
- **Images:** Wherever images are necessary for the design (like hero backgrounds, placeholders for services, or staff avatars if not provided), you MUST ONLY use 100% royalty-free placeholder images. For example, use Unsplash direct image IDs like \`https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80\` or services like \`https://picsum.photos/800/600\`. Do not leave src attributes empty and ensure all images are royalty-free.
- **Navigation Links:** Do NOT generate any internal relative links (like \`/about\` or \`/book\`). All navigation links MUST use anchor tags pointing to section IDs on the same page (e.g., \`#about\`, \`#services\`) to prevent 404 "Page Not Found" errors when users click them in the preview.

REQUIRED PLACEHOLDERS to use in your HTML:
- {{shop.name}} : The name of the shop (use in headers/hero)
- {{shop.description}} : The description of the shop
- {{primaryColor}} : Use as an inline style or Tailwind arbitrary value if needed
- {{secondaryColor}} : Use as an inline style or Tailwind arbitrary value if needed
- {{aboutUs}} : A placeholder for the shop admin to fill in their "About Us" story.

DYNAMIC LOOPS (You MUST iterate over these arrays to build the sections):

1. SERVICES LOOP (Must support multi-select):
{{#each shop.services}}
  <div class="service-card-example ...">
     <input type="checkbox" name="selectedServices" value="{{this.id}}" id="service-{{this.id}}">
     <label for="service-{{this.id}}">
       <h3>{{this.name}}</h3>
       <p>{{this.description}}</p>
       <span>\${{this.price}}</span>
       <span>{{this.duration}} mins</span>
     </label>
  </div>
{{/each}}

2. STAFF LOOP:
{{#each shop.users}}
  <div class="staff-card-example ...">
     <h3>{{this.name}}</h3>
     <p>{{this.role}}</p>
  </div>
{{/each}}

3. REVIEWS LOOP:
{{#each shop.reviews}}
  <div class="review-card-example ...">
     <p>"{{this.comment}}"</p>
     <span>- {{this.user.name}}</span>
     <span>{{this.rating}} Stars</span>
  </div>
{{/each}}

4. PORTFOLIO GALLERY LOOP:
{{#each shop.portfolioImages}}
  <div class="gallery-item-example ...">
     <img src="{{this.imageUrl}}" alt="{{this.caption}}">
  </div>
{{/each}}`;

    if (baseHtml) {
      userPrompt += `\n\n--- EXISTING TEMPLATE ---
Please use the following HTML and CSS as your base starting point, and ONLY modify what is necessary to fulfill the user's prompt. Do NOT lose the existing data bindings or structure unless requested to change it.

HTML:
\`\`\`html
${baseHtml}
\`\`\`

CSS:
\`\`\`css
${baseCss}
\`\`\`
-----------------------`;
    }

    if (shopContextStr) {
      userPrompt += `\n\n${shopContextStr}`;
    }

    if (uploadedAssets.length > 0) {
      userPrompt += `\n\n--- UPLOADED ASSETS ---
The user has provided the following asset files that you MUST use in your design (e.g., as logos, hero backgrounds, or profile pictures). 
Use the exact provided URLs in the src or background-image attributes:
${uploadedAssets.map(a => `- ${a.fileName}: ${a.url}`).join('\n')}
-----------------------`;
    }

    userPrompt += `\n\nOutput ONLY the raw, valid JSON object matching the schema { "htmlCode": "...", "cssCode": "..." }. No markdown blocks.`;

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
        shopId: targetShopId || null,
      },
    });

    const FOLDER_PATH = `/barbersaas/${targetShopId}/${name}`;
    await uploadFileToPath(FOLDER_PATH, 'index.html', 'text/html', Buffer.from(result.htmlCode, 'utf-8'));
    if (result.cssCode) {
      await uploadFileToPath(FOLDER_PATH, 'styles.css', 'text/css', Buffer.from(result.cssCode, 'utf-8'));
    }

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
