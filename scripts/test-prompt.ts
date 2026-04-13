import { PrismaClient } from '@prisma/client';

async function main() {
  const prompt = "A clean, dark-mode, neon green futuristic barbershop layout";
  
  let shopContextStr = `
--- REAL SHOP DATA CONTEXT ---
The user has provided the following real data for the shop to help you design a more specific template.
Use these specific services, products, staff names, reviews, and contact details in your design where appropriate (as dummy data injected via Handlebars, or to inspire the design).

Shop Name: Heritage Haircuts
Shop Description: A classic barbershop experience.
Contact Phone: 555-1234
Contact Email: contact@heritage.com
Address: 123 Main St
Social Links: {}
About Us / Story: We have been cutting hair for 20 years.

Services Available:
- Haircut: $30 (30 mins)
- Shave: $25 (30 mins)

Products Available:
- Pomade: $15
- Beard Oil: $20

Staff Members:
- John Doe (STAFF)
- Jane Smith (STAFF)

Reviews:
- Mike: 5 stars - "Great cut!"

Gallery Images Available:
N/A

Custom Pages/Sections Configured:
[]
------------------------------
`;

  const systemInstruction = `You are an expert frontend developer and web designer.
Your task is to generate a highly customized, fully responsive web template using HTML5 and Tailwind CSS based on the user's prompt.
You MUST strictly adhere to the following rules:
1. Output ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
2. The JSON object must have exactly two keys: "htmlCode" and "cssCode".
3. The "htmlCode" must contain the full HTML structure (assume it will be placed inside a <body> tag, provide the main wrapper divs).
4. The "cssCode" should contain any custom CSS (e.g., @import fonts, custom animations). Leave as empty string if not needed.
5. You MUST use the exact Handlebars placeholders provided by the user for dynamic data. Do NOT invent new placeholders, and do NOT use Handlebars filters, pipes, or logic (e.g., NO \`{{primaryColor | default '#000'}}\` or \`{{#if}}\` unless explicitly provided in loops). ONLY use raw variable names like \`{{primaryColor}}\`.
6. Make the design visually stunning, modern, and tailored to the user's specific request.`;

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

  userPrompt += `\n\n${shopContextStr}`;
  userPrompt += `\n\nOutput ONLY the raw, valid JSON object matching the schema { "htmlCode": "...", "cssCode": "..." }. No markdown blocks.`;

  console.log("========== SYSTEM INSTRUCTION ==========\n");
  console.log(systemInstruction);
  console.log("\n========== USER PROMPT ==========\n");
  console.log(userPrompt);
}

main().catch(console.error);
