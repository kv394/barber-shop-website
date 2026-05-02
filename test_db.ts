import { prisma } from './lib/prisma';
prisma.shop.findFirst({ where: { id: 'cmn9kj24n0000lqzc7kcsmpst' }, select: { customization: true } }).then(s => console.log(s?.customization));
