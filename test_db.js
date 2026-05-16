require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const shop = await prisma.shop.findFirst();
  if (!shop) return console.log("No shop found");
  
  const product = await prisma.product.findFirst({ where: { shopId: shop.id } });
  if (!product) return console.log("No product found");

  try {
    const po = await prisma.purchaseOrder.create({
      data: {
        shopId: shop.id,
        supplier: "Test Supplier",
        status: "DRAFT",
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitCost: 10
            }
          ]
        }
      }
    });
    console.log("Success:", po);
  } catch(e) {
    console.error("Prisma error:", e);
  }
}
test().finally(() => prisma.$disconnect());
