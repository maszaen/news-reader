import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { getCache, setCache } from '../utils/redis.js';

const router = Router();

// GET /api/feeds - List all active feeds
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Try cache first
    const cacheKey = 'feeds:all';
    const cached = await getCache<unknown[]>(cacheKey);
    
    if (cached) {
      res.json({ feeds: cached, fromCache: true });
      return;
    }
    
    const feeds = await (prisma as any).feed.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        displayName: true,
        description: true,
        category: true,
        websiteUrl: true,
        logoUrl: true,
        feedUrl: true,
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { title: 'asc' }
    });
    
    // Cache for 5 minutes
    await setCache(cacheKey, feeds, 300);
    
    res.json({ feeds });
  } catch (error) {
    console.error('Error fetching feeds:', error);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

// GET /api/feeds/:id - Get specific feed with recent articles
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const feed = await (prisma as any).feed.findUnique({
      where: { id },
      include: {
        articles: {
          take: 20,
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            author: true,
            imageUrl: true,
            publishedAt: true,
            providerName: true,
          }
        }
      }
    });
    
    if (!feed) {
      res.status(404).json({ error: 'Feed not found' });
      return;
    }
    
    res.json({ feed });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// GET /api/feeds/category/:category - Get feeds by category
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    
    const feeds = await (prisma as any).feed.findMany({
      where: { 
        category,
        isActive: true 
      },
      select: {
        id: true,
        title: true,
        displayName: true,
        description: true,
        category: true,
        websiteUrl: true,
        logoUrl: true,
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { title: 'asc' }
    });
    
    res.json({ feeds });
  } catch (error) {
    console.error('Error fetching feeds by category:', error);
    res.status(500).json({ error: 'Failed to fetch feeds' });
  }
});

export { router as feedsRouter };



