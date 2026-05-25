import { prisma } from '../lib/prisma';

async function main() {
  const admin = await prisma.user.findUnique({
    where: { email: 'admin@heritagehaircuts.com' },
  });
  console.log('Admin:', admin?.id, 'Shop:', admin?.shopId);

  if (admin?.shopId) {
    const clients = await prisma.user.findMany({ where: { shopId: admin.shopId, role: 'CLIENT' } });
    console.log('Clients count:', clients.length);
    if (clients.length === 0) {
      console.log('No clients found for this shop! Let me just create a dummy client to satisfy the review generator.');
      
      const dummyClient = await prisma.user.create({
        data: {
          email: 'dummyclient_' + Date.now() + '@example.com',
          name: 'Dummy Client',
          role: 'CLIENT',
          shopId: admin.shopId
        }
      });
      console.log('Created dummy client:', dummyClient.id);
    }
  }
}
main().finally(() => prisma.$disconnect());
