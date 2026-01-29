import Parser from 'rss-parser';
import { prisma } from '../utils/prisma.js';
import { deleteCache } from '../utils/redis.js';

// Define custom feed type
type CustomItem = {
  mediaContent?: { $?: { url?: string }; url?: string };
  mediaThumbnail?: { $?: { url?: string }; url?: string };
  'content:encoded'?: string;
};

const parser: Parser<Record<string, unknown>, CustomItem> = new Parser({
  timeout: 30000,
  headers: {
    'User-Agent': 'Reapublix RSS Reader/1.0',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
    ],
  },
});

export interface FeedResult {
  feedId: string;
  title: string;
  newArticles: number;
  errors: string[];
}

/**
 * Fetch and parse a single RSS feed
 */
export async function fetchFeed(feedId: string): Promise<FeedResult> {
  const result: FeedResult = {
    feedId,
    title: '',
    newArticles: 0,
    errors: [],
  };
  
  try {
    // Get feed info
    const feed = await (prisma as any).feed.findUnique({
      where: { id: feedId }
    });
    
    if (!feed) {
      result.errors.push('Feed not found');
      return result;
    }
    
    result.title = feed.title;
    
    // Parse RSS feed
    console.log(`📡 Fetching: ${feed.displayName} (${feed.feedUrl})`);
    const parsed = await parser.parseURL(feed.feedUrl);
    
    if (!parsed.items || parsed.items.length === 0) {
      result.errors.push('No items in feed');
      return result;
    }
    
    // Process each item
    for (const item of parsed.items) {
      try {
        // Skip if no URL
        if (!item.link) continue;
        
        // Check if article already exists
        const exists = await (prisma as any).article.findUnique({
          where: { url: item.link },
          select: { id: true }
        });
        
        if (exists) continue;
        
        // Extract image URL
        let imageUrl: string | null = null;
        
        // Try different image sources
        if (item.enclosure?.url) {
          imageUrl = item.enclosure.url;
        } else if (item.mediaContent) {
          const media = item.mediaContent;
          imageUrl = media.$?.url || (typeof media.url === 'string' ? media.url : null);
        } else if (item.mediaThumbnail) {
          const thumb = item.mediaThumbnail;
          imageUrl = thumb.$?.url || (typeof thumb.url === 'string' ? thumb.url : null);
        }
        
        // Parse published date
        const publishedAt = item.pubDate 
          ? new Date(item.pubDate) 
          : item.isoDate 
            ? new Date(item.isoDate)
            : new Date();
        
        // Create article with analytics
        await (prisma as any).article.create({
          data: {
            feedId: feed.id, // Explicitly use feedId, prevent TS confusion on relation
            title: item.title?.substring(0, 500) || 'Untitled',
            content: item.content || item['content:encoded'] || null,
            summary: item.contentSnippet?.substring(0, 1000) || item.summary?.substring(0, 1000) || null,
            url: item.link,
            author: item.creator || null,
            imageUrl: imageUrl?.substring(0, 2048),
            publishedAt,
            providerName: feed.displayName,
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
        
        result.newArticles++;
      } catch (itemError) {
        const errorMsg = itemError instanceof Error ? itemError.message : 'Unknown error';
        console.error(`⚠️ Item error (${item.title || 'No Title'}):`, errorMsg); // Debug
        result.errors.push(`Item error: ${errorMsg}`);
      }
    }
    
    // Update feed's last fetched timestamp
    await (prisma as any).feed.update({
      where: { id: feedId },
      data: { lastFetchedAt: new Date() }
    });
    
    // Invalidate article caches
    await deleteCache('articles:*');
    
    console.log(`✅ ${feed.displayName}: ${result.newArticles} new articles`);
    if (result.errors.length > 0) {
      console.log(`❌ Errors in ${feed.displayName}:`, JSON.stringify(result.errors, null, 2));
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(`Feed error: ${errorMsg}`);
    console.error(`❌ Error fetching feed ${feedId}:`, errorMsg);
  }
  
  return result;
}

/**
 * Fetch all active feeds
 */
export async function fetchAllFeeds(): Promise<FeedResult[]> {
  const feeds = await (prisma as any).feed.findMany({
    where: { isActive: true },
    select: { id: true }
  });
  
  console.log(`\n🚀 Starting fetch for ${feeds.length} feeds...`);
  
  const results: FeedResult[] = [];
  
  // Process feeds sequentially to avoid overwhelming sources
  for (const feed of feeds) {
    const result = await fetchFeed(feed.id);
    results.push(result);
    
    // Small delay between feeds
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const totalNew = results.reduce((sum, r) => sum + r.newArticles, 0);
  const errors = results.filter(r => r.errors.length > 0).length;
  
  console.log(`\n📊 Fetch complete: ${totalNew} new articles, ${errors} feeds with errors\n`);
  
  return results;
}

/**
 * Clean up old articles (optional, for maintenance)
 */
export async function cleanupOldArticles(daysOld = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  const { count } = await (prisma as any).article.deleteMany({
    where: {
      publishedAt: { lt: cutoffDate },
      // Keep articles with significant engagement
      // Note: Relation filters in deleteMany are not supported in Prisma yet
      // analytics: {
      //   OR: [
      //     { likeCount: { lt: 5 } },
      //     { bookmarkCount: { lt: 2 } }
      //   ]
      // }
    }
  });
  
  console.log(`🧹 Cleaned up ${count} old articles`);
  
  return count;
}



