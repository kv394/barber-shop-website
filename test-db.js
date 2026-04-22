const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.dynamicTemplate.findUnique({ where: { name: 'heritage-haircuts-template' } });
  console.log("HTML:", t.htmlCode.substring(t.htmlCode.length - 200));
  console.log("CSS:", t.cssCode.substring(t.cssCode.length - 200));
}
main().finally(() => prisma.$disconnect());
