import cron from 'node-cron';
import { fetchGuardian } from './services/news/guardian.js';
import { fetchNYT } from './services/news/nytimes.js';
import { flushViewCounts, recalculatePopularityScores } from './services/analytics.js';
import { prisma } from './utils/prisma.js';
import { redis } from './utils/redis.js';

console.log('🔄 Reapublix News Aggregator Worker starting...');

// Wait for services to be ready
async function waitForServices(): Promise<void> {
  let retries = 10;
  
  while (retries > 0) {
    try {
      await (prisma as any).$queryRaw`SELECT 1`;
      await redis.ping();
      console.log('✅ Database and Redis connected');
      return;
    } catch (error) {
      console.log(`⏳ Waiting for services... (${retries} retries left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error('Failed to connect to services');
}

async function main(): Promise<void> {
  await waitForServices();
  
  // Initial fetch on startup
  console.log('📡 Running initial News API fetch...');
  await Promise.allSettled([
    fetchGuardian(),
    fetchNYT()
  ]);
  
  // 1. Guardian API: Every 5 minutes (5000 reqs/day quota)
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n⏰ Triggering Guardian fetch...');
    await fetchGuardian();
  });

  // 2. The New York Times API: Every 5 minutes (500 reqs/day quota)
  // 5 mins = 12/hr = 288/day. Safe.
  cron.schedule('*/5 * * * *', async () => {
    console.log('\n⏰ Triggering NYT fetch...');
    await fetchNYT();
  });
  
  // Flush view counts every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await flushViewCounts();
  });
  
  // Recalculate popularity scores every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    await recalculatePopularityScores();
  });
  
  // Daily cleanup at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('🧹 Running daily cleanup...');
    // Could add cleanup logic here
  });
  
  console.log('📅 Cron jobs scheduled:');
  console.log('  - Guardian API: every 5 mins');
  console.log('  - NYT API: every 5 mins');
  console.log('  - View count flush: every 5 minutes');
  console.log('  - Popularity recalculation: every 30 minutes');
  console.log('  - Daily cleanup: 3:00 AM');
  console.log('\n🎯 Worker is running...\n');
}

main().catch((error) => {
  console.error('Worker startup failed:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down worker...');
  await (prisma as any).$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down worker...');
  await (prisma as any).$disconnect();
  process.exit(0);
});
