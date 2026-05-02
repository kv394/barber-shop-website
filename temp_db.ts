import { prisma } from './lib/prisma';
prisma.shop.findMany({ select: { name: true, customDomain: true, subdomain: true } }).then(console.log);
