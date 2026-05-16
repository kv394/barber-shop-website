require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { prisma } = require('./lib/prisma');
prisma.systemLog.findMany({ orderBy: { createdAt: 'desc' }, take: 2 }).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
