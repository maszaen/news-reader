
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Get the latet article
  const latest = await prisma.article.findFirst({
    orderBy: { publishedAt: 'desc' }
  });

  if (latest) {
    console.log(`Updating article: "${latest.title}"`);
    console.log(`Current category: ${latest.category}`);
    
    // Force update to 'technology'
    await prisma.article.update({
      where: { id: latest.id },
      data: { category: 'technology' }
    });
    
    console.log('✅ Updated to "technology".');
    
    // Also update the second one to 'business' for variety
    const second = await prisma.article.findFirst({
        orderBy: { publishedAt: 'desc' },
        skip: 1
    });
    
    if (second) {
         await prisma.article.update({
            where: { id: second.id },
            data: { category: 'business' }
        });
        console.log(`✅ Updated second article "${second.title}" to "business".`);
    }

  } else {
    console.log('No articles found.');
  }
}

main()
.catch(console.error)
.finally(() => prisma.$disconnect());
