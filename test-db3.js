const { prisma } = require('./lib/prisma.ts');
async function main() {
  const t = await prisma.dynamicTemplate.findUnique({ where: { name: 'heritage-haircuts-template' } });
  console.log(t.htmlCode.substring(t.htmlCode.length - 500));
}
main().finally(() => prisma.$disconnect());
