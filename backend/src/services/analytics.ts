import { prisma } from '../utils/prisma.js';
import { getAndResetViewCounts } from '../utils/redis.js';
import { calculatePopularityScore } from '../utils/popularity.js';

/**
 * Flush buffered view counts from Redis to database
 */
export async function flushViewCounts(): Promise<void> {
  console.log('📊 Flushing view counts to database...');
  
  const viewCounts = await getAndResetViewCounts();
  
  if (viewCounts.size === 0) {
    console.log('No view counts to flush');
    return;
  }
  
  for (const [articleId, count] of viewCounts) {
    try {
      await (prisma as any).articleAnalytics.upsert({
        where: { articleId },
        update: {
          viewCount: { increment: count },
          lastViewedAt: new Date(),
        },
        create: {
          articleId,
          viewCount: count,
          lastViewedAt: new Date(),
        }
      });
    } catch (error) {
      console.error(`Error updating view count for ${articleId}:`, error);
    }
  }
  
  console.log(`✅ Flushed ${viewCounts.size} article view counts`);
}

/**
 * Recalculate popularity scores for all articles
 */
export async function recalculatePopularityScores(): Promise<void> {
  console.log('📈 Recalculating popularity scores...');
  
  const analytics = await (prisma as any).articleAnalytics.findMany({
    include: {
      article: {
        select: { publishedAt: true }
      }
    }
  });
  
  let updated = 0;
  
  for (const analytic of analytics) {
    try {
      const score = calculatePopularityScore({
        viewCount: analytic.viewCount,
        likeCount: analytic.likeCount,
        bookmarkCount: analytic.bookmarkCount,
        shareCount: analytic.shareCount,
        publishedAt: analytic.article.publishedAt,
      });
      
      await (prisma as any).articleAnalytics.update({
        where: { id: analytic.id },
        data: { popularityScore: score }
      });
      
      updated++;
    } catch (error) {
      console.error(`Error updating score for ${analytic.articleId}:`, error);
    }
  }
  
  console.log(`✅ Updated ${updated} popularity scores`);
}

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(): Promise<{
  totalArticles: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  topArticles: Array<{
    title: string;
    viewCount: number;
    likeCount: number;
  }>;
}> {
  const [counts, topArticles] = await Promise.all([
    (prisma as any).articleAnalytics.aggregate({
      _sum: {
        viewCount: true,
        likeCount: true,
        bookmarkCount: true,
      },
      _count: true,
    }),
    (prisma as any).article.findMany({
      take: 5,
      orderBy: {
        analytics: { popularityScore: 'desc' }
      },
      select: {
        title: true,
        analytics: {
          select: {
            viewCount: true,
            likeCount: true,
          }
        }
      }
    })
  ]);
  
  return {
    totalArticles: counts._count,
    totalViews: counts._sum.viewCount || 0,
    totalLikes: counts._sum.likeCount || 0,
    totalBookmarks: counts._sum.bookmarkCount || 0,
    topArticles: topArticles.map((a: any) => ({
      title: a.title,
      viewCount: a.analytics?.viewCount || 0,
      likeCount: a.analytics?.likeCount || 0,
    }))
  };
}



