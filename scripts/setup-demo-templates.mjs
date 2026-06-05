#!/usr/bin/env node
/**
 * One-time script to set up demo shop templates.
 * Sets template='custom' and loads the HTML from public/html-sections/ into customHtml.
 *
 * Usage: node scripts/setup-demo-templates.mjs
 */
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const prisma = new PrismaClient();

const SHOPS = [
  {
    slug: 'heritage-haircuts',
    htmlFile: 'heritage-haircuts.html',
  },
  {
    slug: 'luxury-nails',
    htmlFile: 'luxury-nails.html',
  },
];

async function main() {
  // First, list all shops so we can find the right ones
  const allShops = await prisma.shop.findMany({
    select: { id: true, name: true, template: true },
  });
  console.log('All shops in DB:');
  allShops.forEach(s => console.log(`  - "${s.name}" (id=${s.id}, template=${s.template})`));

  for (const shopConfig of SHOPS) {
    console.log(`\n--- Setting up: ${shopConfig.slug} ---`);

    // Find the shop by name (case-insensitive, try multiple formats)
    const searchNames = [
      shopConfig.slug.replace(/-/g, ' '),  // "heritage haircuts"
      shopConfig.slug.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' '), // "Heritage Haircuts"
      shopConfig.slug, // "heritage-haircuts"
    ];

    let shop = null;
    for (const name of searchNames) {
      shop = allShops.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (shop) break;
    }

    if (!shop) {
      console.log(`⚠️  Shop "${shopConfig.slug}" not found with any name format. Skipping.`);
      continue;
    }

    // Get full shop data
    const fullShop = await prisma.shop.findUnique({ where: { id: shop.id } });
    console.log(`Found shop: ${fullShop.name} (${fullShop.id}), current template: ${fullShop.template}`);

    // Read the HTML file
    const htmlPath = join(__dirname, '..', 'public', 'html-sections', shopConfig.htmlFile);
    let html;
    try {
      html = readFileSync(htmlPath, 'utf-8');
      console.log(`Loaded HTML: ${shopConfig.htmlFile} (${html.length} chars)`);
    } catch (e) {
      console.error(`❌ Failed to read ${htmlPath}:`, e.message);
      continue;
    }

    // Update the shop
    const currentCustomization = (fullShop.customization) || {};
    const updatedShop = await prisma.shop.update({
      where: { id: fullShop.id },
      data: {
        template: 'custom',
        customization: {
          ...currentCustomization,
          customHtml: html,
        },
      },
    });

    console.log(`✅ Updated "${updatedShop.name}": template="${updatedShop.template}", customHtml=${html.length} chars`);
  }
}

main()
  .catch((e) => {
    console.error('Script failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
