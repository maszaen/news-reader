import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { prisma } from '../utils/prisma.js';
import { getCache, setCache, incrementViewCount } from '../utils/redis.js';
import { authenticateRequired } from '../middleware/auth.js';

const router = Router();

// GET /api/articles - Get articles with pagination and filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const category = req.query.category as string;
    const feedId = req.query.feedId as string;
    const sort = (req.query.sort as string) || 'popularity';
    const skip = (page - 1) * limit;
    
    // Build cache key
    const cacheKey = `articles:${category || 'all'}:${feedId || 'all'}:${sort}:${page}:${limit}`;
    const cached = await getCache<{ articles: unknown[]; total: number }>(cacheKey);
    
    if (cached) {
      res.json({ ...cached, fromCache: true, page, limit });
      return;
    }
    
    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (category) {
      where.category = category;
    }
    
    if (feedId) {
      where.feedId = feedId;
    }
    
    // Determine order
    let orderBy: Record<string, unknown>[] = [];
    
    if (sort === 'popularity') {
      orderBy = [
        { analytics: { popularityScore: 'desc' } },
        { publishedAt: 'desc' }
      ];
    } else if (sort === 'recent') {
      orderBy = [{ publishedAt: 'desc' }];
    } else if (sort === 'views') {
      orderBy = [{ analytics: { viewCount: 'desc' } }];
    }
    
    // Fetch articles
    const [articles, total] = await Promise.all([
      (prisma as any).article.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          summary: true,
          author: true,
          category: true, // Added category field
          imageUrl: true,
          url: true,
          publishedAt: true,
          providerName: true,
          providerUrl: true,
          feed: {
            select: {
              id: true,
              displayName: true,
              category: true,
              logoUrl: true,
            }
          },
          analytics: {
            select: {
              viewCount: true,
              likeCount: true,
              bookmarkCount: true,
              popularityScore: true,
            }
          },
          _count: {
            select: {
              likes: true,
              bookmarks: true,
            }
          }
        }
      }),
      (prisma as any).article.count({ where })
    ]);
    
    // Add user interaction status if authenticated
    let articlesWithUserData = articles;
    
    if (req.user) {
      const articleIds = articles.map((a: any) => a.id);
      
      const [userLikes, userBookmarks] = await Promise.all([
        (prisma as any).userLike.findMany({
          where: {
            userId: req.user.userId,
            articleId: { in: articleIds }
          },
          select: { articleId: true }
        }),
        (prisma as any).userBookmark.findMany({
          where: {
            userId: req.user.userId,
            articleId: { in: articleIds }
          },
          select: { articleId: true }
        })
      ]);
      
      const likedIds = new Set(userLikes.map((l: any) => l.articleId));
      const bookmarkedIds = new Set(userBookmarks.map((b: any) => b.articleId));
      
      articlesWithUserData = articles.map((article: any) => ({
        ...article,
        isLiked: likedIds.has(article.id),
        isBookmarked: bookmarkedIds.has(article.id),
      }));
    }
    
    const response = {
      articles: articlesWithUserData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    
    // Cache for 2 minutes
    await setCache(cacheKey, response, 120);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// GET /api/articles/trending - Get trending articles
router.get('/trending', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'articles:trending';
    const cached = await getCache<unknown[]>(cacheKey);
    
    if (cached) {
      res.json({ articles: cached, fromCache: true });
      return;
    }
    
    const articles = await (prisma as any).article.findMany({
      take: 10,
      orderBy: {
        analytics: { popularityScore: 'desc' }
      },
      where: {
        publishedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        id: true,
        title: true,
        summary: true,
        imageUrl: true,
        publishedAt: true,
        category: true,
        providerName: true,
        feed: {
          select: {
            displayName: true,
            category: true,
          }
        },
        analytics: {
          select: {
            viewCount: true,
            likeCount: true,
            popularityScore: true,
          }
        }
      }
    });
    
    await setCache(cacheKey, articles, 300);
    
    res.json({ articles });
  } catch (error) {
    console.error('Error fetching trending:', error);
    res.status(500).json({ error: 'Failed to fetch trending articles' });
  }
});

// GET /api/articles/:id - Get single article detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const article = await (prisma as any).article.findUnique({
      where: { id },
      include: {
        feed: {
          select: {
            id: true,
            displayName: true,
            category: true,
            websiteUrl: true,
            logoUrl: true,
          }
        },
        analytics: {
          select: {
            viewCount: true,
            likeCount: true,
            bookmarkCount: true,
            shareCount: true,
          }
        },
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          }
        }
      }
    });
    
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    
    // Add user interaction status
    let isLiked = false;
    let isBookmarked = false;
    
    if (req.user) {
      const [like, bookmark] = await Promise.all([
        (prisma as any).userLike.findUnique({
          where: {
            userId_articleId: {
              userId: req.user.userId,
              articleId: id
            }
          }
        }),
        (prisma as any).userBookmark.findUnique({
          where: {
            userId_articleId: {
              userId: req.user.userId,
              articleId: id
            }
          }
        })
      ]);
      
      isLiked = !!like;
      isBookmarked = !!bookmark;
    }
    
    res.json({ 
      article: {
        ...article,
        isLiked,
        isBookmarked,
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// POST /api/articles/:id/view - Track article view
router.post('/:id/view', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Verify article exists
    const article = await (prisma as any).article.findUnique({
      where: { id },
      select: { id: true }
    });
    
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    
    // Generate hashes for anonymous tracking
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex').substring(0, 16);
    const uaHash = crypto.createHash('sha256').update(userAgent).digest('hex').substring(0, 16);
    
    // Buffer view count in Redis for batch update
    await incrementViewCount(id);
    
    // Record view for analytics
    await (prisma as any).articleView.create({
      data: {
        articleId: id,
        userId: req.user?.userId,
        ipHash,
        userAgentHash: uaHash,
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ error: 'Failed to track view' });
  }
});

// POST /api/articles/:id/like - Like article (auth required)
router.post('/:id/like', authenticateRequired, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Check if already liked
    const existingLike = await (prisma as any).userLike.findUnique({
      where: {
        userId_articleId: { userId, articleId: id }
      }
    });
    
    if (existingLike) {
      res.status(409).json({ error: 'Already liked' });
      return;
    }
    
    // Create like and update analytics atomically
    await prisma.$transaction([
      (prisma as any).userLike.create({
        data: { userId, articleId: id }
      }),
      (prisma as any).articleAnalytics.upsert({
        where: { articleId: id },
        update: { likeCount: { increment: 1 } },
        create: { articleId: id, likeCount: 1 }
      })
    ]);
    
    res.json({ success: true, liked: true });
  } catch (error) {
    console.error('Error liking article:', error);
    res.status(500).json({ error: 'Failed to like article' });
  }
});

// DELETE /api/articles/:id/like - Unlike article (auth required)
router.delete('/:id/like', authenticateRequired, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    // Check if liked
    const existingLike = await (prisma as any).userLike.findUnique({
      where: {
        userId_articleId: { userId, articleId: id }
      }
    });
    
    if (!existingLike) {
      res.status(404).json({ error: 'Like not found' });
      return;
    }
    
    // Remove like and update analytics atomically
    await prisma.$transaction([
      (prisma as any).userLike.delete({
        where: {
          userId_articleId: { userId, articleId: id }
        }
      }),
      (prisma as any).articleAnalytics.update({
        where: { articleId: id },
        data: { likeCount: { decrement: 1 } }
      })
    ]);
    
    res.json({ success: true, liked: false });
  } catch (error) {
    console.error('Error unliking article:', error);
    res.status(500).json({ error: 'Failed to unlike article' });
  }
});

// POST /api/articles/:id/bookmark - Bookmark article (auth required)
router.post('/:id/bookmark', authenticateRequired, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { notes } = req.body;
    
    // Check if already bookmarked
    const existingBookmark = await (prisma as any).userBookmark.findUnique({
      where: {
        userId_articleId: { userId, articleId: id }
      }
    });
    
    if (existingBookmark) {
      res.status(409).json({ error: 'Already bookmarked' });
      return;
    }
    
    // Create bookmark and update analytics
    await prisma.$transaction([
      (prisma as any).userBookmark.create({
        data: { userId, articleId: id, notes }
      }),
      (prisma as any).articleAnalytics.upsert({
        where: { articleId: id },
        update: { bookmarkCount: { increment: 1 } },
        create: { articleId: id, bookmarkCount: 1 }
      })
    ]);
    
    res.json({ success: true, bookmarked: true });
  } catch (error) {
    console.error('Error bookmarking article:', error);
    res.status(500).json({ error: 'Failed to bookmark article' });
  }
});

// DELETE /api/articles/:id/bookmark - Remove bookmark (auth required)
router.delete('/:id/bookmark', authenticateRequired, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const existingBookmark = await (prisma as any).userBookmark.findUnique({
      where: {
        userId_articleId: { userId, articleId: id }
      }
    });
    
    if (!existingBookmark) {
      res.status(404).json({ error: 'Bookmark not found' });
      return;
    }
    
    await prisma.$transaction([
      (prisma as any).userBookmark.delete({
        where: {
          userId_articleId: { userId, articleId: id }
        }
      }),
      (prisma as any).articleAnalytics.update({
        where: { articleId: id },
        data: { bookmarkCount: { decrement: 1 } }
      })
    ]);
    
    res.json({ success: true, bookmarked: false });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    res.status(500).json({ error: 'Failed to remove bookmark' });
  }
});

export { router as articlesRouter };



