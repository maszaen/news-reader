import { prisma } from '../../utils/prisma.js';
import { deleteCache } from '../../utils/redis.js';
import { NormalizedArticle } from './types.js';

/**
 * Store normalized articles into the database
 */
export async function storeArticles(providerFeedName: string, articles: NormalizedArticle[]) {
  // 1. Find the Feed ID for this provider (System Feeds must be seeded first)
  const feed = await (prisma as any).feed.findFirst({
    where: { displayName: providerFeedName }
  });

  if (!feed) {
    console.error(`❌ Feed provider not found in DB: ${providerFeedName}. Please run seed script.`);
    return;
  }

  let newCount = 0;
  let errors = 0;

  console.log(`📥 Processing ${articles.length} articles for ${providerFeedName}...`);

  for (const article of articles) {
    try {
      // Deduplication by URL
      const exists = await (prisma as any).article.findUnique({
        where: { url: article.url },
        select: { id: true }
      });

      if (exists) continue;

      // Clean content truncation markers (common in free NewsAPI)
      let cleanContent = article.content || '';
      cleanContent = cleanContent.replace(/\[\+?\d+ chars\]$/, '').trim();
      cleanContent = cleanContent.replace(/\.\.\.\s*\[\d+\s*chars\]$/, '...').trim();

      // Create article
      await (prisma as any).article.create({
        data: {
          feedId: feed.id,
          title: article.title?.substring(0, 500) || 'Untitled',
          summary: article.summary?.substring(0, 1000) || '',
          content: cleanContent,
          url: article.url,
          imageUrl: article.imageUrl?.substring(0, 2048),
          publishedAt: article.publishedAt,
          author: article.author?.substring(0, 100) || null,
          category: article.category || 'news',
          providerName: article.originalSource,
          providerUrl: feed.websiteUrl,
          analytics: {
            create: {
              viewCount: 0,
              likeCount: 0,
              bookmarkCount: 0,
              shareCount: 0,
              popularityScore: 0,
            }
          }
        }
      });
      newCount++;
    } catch (e: any) {
      errors++;
      // console.error(`Failed to save article ${article.url}:`, e.message); // Too verbose
    }
  }

  // Update feed timestamp and clear cache if data changed
  if (newCount > 0) {
    await (prisma as any).feed.update({
      where: { id: feed.id },
      data: { lastFetchedAt: new Date() }
    });
    
    await deleteCache('articles:*');
  }

  console.log(`✅ ${providerFeedName}: Saved ${newCount} new articles. (${errors} failed/skipped)`);
}
