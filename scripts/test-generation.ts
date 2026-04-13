import fs from 'fs';

async function main() {
  const prompt = "A clean, dark-mode, neon green futuristic barbershop layout";
  const htmlPath = '/tmp/stitch/code.html';
  let baseHtml = '';
  if (fs.existsSync(htmlPath)) {
    baseHtml = fs.readFileSync(htmlPath, 'utf8');
  } else {
    console.log("Could not find /tmp/stitch/code.html");
    return;
  }

  let shopContextStr = `
--- REAL SHOP DATA CONTEXT ---
Shop Name: Heritage Haircuts
Shop Description: A classic barbershop experience.
Contact Phone: 555-1234
Contact Email: contact@heritage.com
Address: 123 Main St
Services Available:
- Haircut: $30 (30 mins)
- Shave: $25 (30 mins)
Staff Members:
- John Doe (STAFF)
- Jane Smith (STAFF)
Reviews:
- Mike: 5 stars - "Great cut!"
------------------------------
`;

  const systemInstruction = `You are an expert frontend developer and web designer.
Your task is to generate a highly customized, fully responsive web template using HTML5 and Tailwind CSS based on the user's prompt.
You MUST strictly adhere to the following rules:
1. Output ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
2. The JSON object must have exactly two keys: "htmlCode" and "cssCode".
3. The "htmlCode" must contain the full HTML structure (assume it will be placed inside a <body> tag, provide the main wrapper divs). Do NOT include <html>, <head>, or <script> tags. React will not execute scripts.
4. The "cssCode" should contain any custom CSS (e.g., @import fonts, custom animations). Leave as empty string if not needed. Move any Google Fonts <link> tags from the base template into @import statements here.
5. You MUST use the exact Handlebars placeholders provided by the user for dynamic data. Do NOT invent new placeholders, and do NOT use Handlebars filters, pipes, or logic (e.g., NO \`{{primaryColor | default '#000'}}\` or \`{{#if}}\` unless explicitly provided in loops). ONLY use raw variable names like \`{{primaryColor}}\`.
6. Make the design visually stunning, modern, and tailored to the user's specific request.
7. TAILWIND CONSTRAINT: You are injecting into an existing Next.js app. Do NOT rely on custom Tailwind configs or \`<script src="https://cdn.tailwindcss.com">\`. You MUST use ONLY standard Tailwind utility classes (e.g., \`bg-zinc-900\`, \`text-emerald-400\`) or arbitrary values (e.g., \`bg-[#121412]\`, \`text-[1.1rem]\`). If the base template uses custom theme classes like \`bg-surface\` or \`text-primary\`, you MUST convert them to standard Tailwind classes or arbitrary hex values to ensure they render correctly!`;

  let userPrompt = `Create a stunning, responsive, and lively Tailwind CSS template for Heritage Haircuts (a barbershop/salon landing page) based on this request:
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
${baseHtml.substring(0, 20000)}
\`\`\`
-----------------------`;
  }

  userPrompt += `\n\n${shopContextStr}`;
  userPrompt += `\n\nOutput ONLY the raw, valid JSON object matching the schema { "htmlCode": "...", "cssCode": "..." }. No markdown blocks.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY, use GEMINI_API_KEY=... npx tsx scripts/test-generation.ts');
    return;
  }

  console.log('Fetching from Gemini...');
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
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
  if (data.error) {
    console.error('Error:', JSON.stringify(data.error, null, 2));
    return;
  }
  
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
  fs.writeFileSync('generated-template.json', cleanText);
  console.log('Successfully wrote to generated-template.json');
}

main().catch(console.error);