const { prisma } = require('./lib/prisma.ts');
async function main() {
  const t = await prisma.dynamicTemplate.findUnique({ where: { name: 'heritage-haircuts-template' } });
  if (t && t.cssCode) {
      console.log("CSS starts with:", t.cssCode.substring(0, 100));
      console.log("CSS ends with:", t.cssCode.substring(t.cssCode.length - 100));
  } else {
      console.log("No cssCode found for template.");
  }
}
main().finally(() => prisma.$disconnect());