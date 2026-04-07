const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.dynamicTemplate.findMany();
  console.log('Templates:', templates.map(t => t.name));
  
  if (templates.length > 0) {
    const first = templates[0].name;
    const found = await prisma.dynamicTemplate.findUnique({
      where: { name: first }
    });
    console.log('Found:', found ? found.name : 'null');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
