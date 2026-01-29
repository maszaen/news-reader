import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default feeds to seed the database
// System Providers for API-based News
const DEFAULT_FEEDS = [
  {
    feedUrl: 'api://guardian',
    title: 'The Guardian',
    displayName: 'The Guardian',
    description: 'Latest world news from The Guardian API',
    category: 'news',
    websiteUrl: 'https://www.theguardian.com',
    logoUrl: 'https://assets.guim.co.uk/images/eagles/2048/default.png',
  },
  {
    feedUrl: 'api://nytimes',
    title: 'The New York Times',
    displayName: 'The New York Times',
    description: 'Top stories from The New York Times',
    category: 'news',
    websiteUrl: 'https://www.nytimes.com',
    logoUrl: 'https://developer.nytimes.com/files/poweredby_nytimes_200c.png',
  }
];

async function main() {
  console.log('🌱 Seeding Reapublix database (API System)...\\n');

  // 1. Cleanup old RSS feeds
  console.log('🧹 Cleaning up old RSS feeds...');
  try {
    const deleted = await prisma.feed.deleteMany({
      where: {
        NOT: {
          feedUrl: { startsWith: 'api://' }
        }
      }
    });
    console.log(`   Removed ${deleted.count} legacy feeds.`);
  } catch (err) {
    console.log('   (Cleanup skipped or failed, persisting...)');
  }
  
  // 2. Seed System Feeds
  console.log('📡 Creating/Updating API System Feeds...');
  
  for (const feed of DEFAULT_FEEDS) {
    try {
      await prisma.feed.upsert({
        where: { feedUrl: feed.feedUrl },
        update: feed,
        create: feed,
      });
      console.log(`  ✅ ${feed.displayName}`);
    } catch (error) {
      console.log(`  ❌ ${feed.displayName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  console.log(`\\n✨ Seeding complete!`);
  console.log(`   ${DEFAULT_FEEDS.length} API sources configured\\n`);
  
  // Show summary
  const feedCount = await prisma.feed.count();
  console.log(`📊 Database summary:`);
  console.log(`   Total feeds: ${feedCount}`);
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
