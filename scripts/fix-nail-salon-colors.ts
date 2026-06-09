// Check BOTH shops that match the slug
import { prisma } from '../lib/prisma';

async function main() {
  const slug = 'luxury-nails--spa-demo';
  const firstWord = slug.split('-').find(w => w.length > 2) || slug.split('-')[0];
  
  const candidates = await prisma.shop.findMany({
    where: { name: { contains: firstWord, mode: 'insensitive' } },
    select: { id: true, name: true, template: true, customization: true },
    take: 50,
  });

  const matches = candidates.filter(
    (s: any) => s.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') === slug.toLowerCase()
  );

  console.log(`Found ${matches.length} shops matching slug "${slug}":`);
  for (const s of matches) {
    const c = (s.customization as any) || {};
    console.log(`\n  ID: ${s.id}`);
    console.log(`  Name: "${s.name}"`);
    console.log(`  Template: ${s.template}`);
    console.log(`  primaryColor: ${c.primaryColor || 'NOT SET'}`);
    console.log(`  Has customHtml: ${!!c.customHtml}`);
    console.log(`  customHtml length: ${c.customHtml?.length || 0}`);
    console.log(`  Would be preferred: ${s.template === 'custom' && !!c.customHtml}`);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
