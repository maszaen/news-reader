const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
console.log('Prisma keys:', Object.keys(prisma));
// Juga coba lowercase dan uppercase manually
console.log('presense of article:', !!prisma.article);
console.log('presense of Article:', !!prisma.Article);
console.log('presense of articles:', !!prisma.articles);
prisma.$disconnect();
