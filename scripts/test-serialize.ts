import { prisma } from './lib/prisma';
import { serialize } from './lib/serialize';

async function main() {
  const shop = await prisma.shop.findUnique({ where: { id: 'cm3shop001heritage0001' } });
  const serialized = serialize(shop);
  console.log('Serialized has customHtml?', !!(serialized.customization as any)?.customHtml);
  
  let dynamicTemplateHtml = null;
  const rawCustom = serialized.customization || {};
  const customHtml = rawCustom.customHtml;
  
  if (customHtml && customHtml.trim() !== '') {
    try {
      const Mustache = (await import('mustache')).default;
      dynamicTemplateHtml = Mustache.render(customHtml, { ...rawCustom });
      console.log('Mustache render successful, len:', dynamicTemplateHtml.length);
    } catch (e) {
      console.log('Mustache error');
      dynamicTemplateHtml = customHtml;
    }
  } else {
    console.log('customHtml is empty or falsy');
  }
}
main().catch(console.error);
