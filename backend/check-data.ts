import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.article.groupBy({
    by: ['providerName'],
    _count: {
      _all: true
    }
  });

  console.log('📊 Article Statistics:');
  counts.forEach(c => {
    console.log(`- ${c.providerName}: ${c._count._all} articles`);
  });
  
  // Check categories too
  const categories = await prisma.article.groupBy({
      by: ['category'],
      _count: { _all: true }
  });
  
  console.log('\n📂 Categories:');
  categories.forEach(c => {
      console.log(`- ${c.category}: ${c._count._all} articles`);
  });

  const latest = await prisma.article.findMany({
    take: 5,
    where: { category: 'technology' },
    orderBy: { publishedAt: 'desc' },
    select: { title: true, category: true, providerName: true, publishedAt: true }
  });
  console.log('\nLatest 5 Tech Articles:');
  console.log(latest);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
