import { prisma } from '../lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  try {
    const htmlCode = fs.readFileSync(path.join(__dirname, '../public/html-sections/SportClips.html'), 'utf-8');
    
    await prisma.shop.updateMany({
      where: { template: 'custom' },
      data: {
        customization: {
          update: {
            customHtml: htmlCode
          }
        }
      }
    });
    
    console.log("Updated customHtml for custom shops!");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
