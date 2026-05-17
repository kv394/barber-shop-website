const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const product = await prisma.product.findFirst();
  console.log("Product:", { id: product.id, name: product.name, barcode: product.barcode });
}
main().catch(console.error).finally(() => prisma.$disconnect());
