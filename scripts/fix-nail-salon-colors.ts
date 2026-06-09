// Update the DB customHtml to check window.__KUTZ_THEME__ for theme colors
import { prisma } from '../lib/prisma';

async function main() {
  const shopId = 'cmpksdwb90000j12g6jzm5dfi';
  
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { id: true, name: true, customization: true }
  });

  if (!shop) { console.log('NOT FOUND'); return; }

  const c = (shop.customization as any) || {};
  let html = c.customHtml || '';
  
  if (!html) {
    console.log('No customHtml found in DB');
    return;
  }

  // Replace the primary color line to check __KUTZ_THEME__ first
  const oldLine = "var primaryColor = shop.primaryColor || '#D4849C';";
  const newLine = "var _t = window.__KUTZ_THEME__ || {};\n          var primaryColor = _t.primaryColor || shop.primaryColor || '#D4849C';";
  
  if (html.includes(oldLine)) {
    html = html.replace(oldLine, newLine);
    console.log('✅ Replaced primaryColor line');
  } else {
    console.log('⚠️ primaryColor line not found in customHtml, checking variations...');
    // Try a more general pattern
    const altLine = "var primaryColor = shop.primaryColor";
    if (html.includes(altLine) && !html.includes('__KUTZ_THEME__')) {
      html = html.replace(altLine, "var _t = window.__KUTZ_THEME__ || {};\n          var primaryColor = _t.primaryColor || shop.primaryColor");
      console.log('✅ Replaced with alt pattern');
    } else if (html.includes('__KUTZ_THEME__')) {
      console.log('Already patched');
      return;
    } else {
      console.log('❌ Could not find pattern to replace');
      return;
    }
  }

  // Also replace secondaryColor line
  const oldSec = "var secondaryColor = shop.secondaryColor || '#C9A96E';";
  const newSec = "var secondaryColor = _t.secondaryColor || shop.secondaryColor || '#C9A96E';";
  if (html.includes(oldSec)) {
    html = html.replace(oldSec, newSec);
    console.log('✅ Replaced secondaryColor line');
  }

  await prisma.shop.update({
    where: { id: shopId },
    data: {
      customization: {
        ...c,
        customHtml: html,
      }
    }
  });

  console.log('✅ Updated customHtml in DB');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
