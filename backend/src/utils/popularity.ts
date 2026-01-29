// Popularity Score Algorithm for Article Ranking

interface ArticleMetrics {
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  shareCount: number;
  publishedAt: Date;
}

// Weight configuration
const WEIGHTS = {
  view: 1,
  like: 5,
  bookmark: 10,
  share: 8,
};

// Score composition
const ENGAGEMENT_WEIGHT = 0.6;
const RECENCY_WEIGHT = 0.4;

/**
 * Calculate the popularity score of an article
 * Higher score = more popular + more recent
 */
export function calculatePopularityScore(metrics: ArticleMetrics): number {
  const now = Date.now();
  const publishedTime = metrics.publishedAt.getTime();
  const ageInHours = (now - publishedTime) / (1000 * 60 * 60);
  
  // Recency factor (semakin baru semakin tinggi)
  // Articles older than 10 days get 0 recency score
  const maxAgeHours = 24 * 10; // 10 days
  const recencyScore = Math.max(0, 100 - (ageInHours / maxAgeHours) * 100);
  
  // Engagement score
  const rawEngagement = 
    (metrics.viewCount * WEIGHTS.view) +
    (metrics.likeCount * WEIGHTS.like) +
    (metrics.bookmarkCount * WEIGHTS.bookmark) +
    (metrics.shareCount * WEIGHTS.share);
  
  // Normalize engagement (log scale to handle viral articles)
  const engagementScore = rawEngagement > 0 
    ? Math.log10(rawEngagement + 1) * 20 
    : 0;
  
  // Combined score
  return (engagementScore * ENGAGEMENT_WEIGHT) + (recencyScore * RECENCY_WEIGHT);
}

/**
 * Batch calculate popularity scores
 */
export function calculateBatchPopularityScores(
  articles: Array<{ id: string } & ArticleMetrics>
): Map<string, number> {
  const scores = new Map<string, number>();
  
  for (const article of articles) {
    scores.set(article.id, calculatePopularityScore(article));
  }
  
  return scores;
}

/**
 * Get trending threshold
 * Articles with score above this are considered "trending"
 */
export function getTrendingThreshold(): number {
  return 30; // Adjustable based on data
}



