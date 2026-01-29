import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { getCache, setCache } from '../utils/redis.js';

const router = Router();

// Feed categories with display info
const CATEGORY_INFO: Record<string, { label: string; icon: string; color: string }> = {
  news: { label: 'News', icon: 'Newspaper', color: '#4285F4' },
  technology: { label: 'Technology', icon: 'Cpu', color: '#EA4335' },
  finance: { label: 'Finance', icon: 'TrendingUp', color: '#34A853' },
  sports: { label: 'Sports', icon: 'Trophy', color: '#FBBC04' },
  entertainment: { label: 'Entertainment', icon: 'Film', color: '#E91E63' },
  science: { label: 'Science', icon: 'Atom', color: '#9C27B0' },
  health: { label: 'Health', icon: 'Heart', color: '#00BCD4' },
  business: { label: 'Business', icon: 'Briefcase', color: '#FF5722' },
  custom: { label: 'Custom', icon: 'Rss', color: '#607D8B' },
};

// GET /api/categories - Get all categories with article counts
router.get('/', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'categories:all';
    const cached = await getCache<unknown[]>(cacheKey);
    
    if (cached) {
      res.json({ categories: cached, fromCache: true });
      return;
    }
    
    // Get article counts per category
    const categoriesData = await (prisma as any).article.groupBy({
      by: ['category'],
      where: {
        feed: { isActive: true }
      },
      _count: { id: true }
    });
    
    // Map to response format
    const categories = categoriesData.map((cat: any) => {
        const categoryKey = cat.category || 'news';
        // Use predefined info or generate default
        const info = CATEGORY_INFO[categoryKey.toLowerCase()] || { 
            label: categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1), 
            icon: 'Hash', // Generic icon
            color: '#607D8B' 
        };
        
        return {
          id: categoryKey,
          label: info.label,
          icon: info.icon,
          color: info.color,
          feedCount: 1, // Placeholder
          articleCount: cat._count.id,
        };
    });
    
    // Sort by article count descending
    categories.sort((a: any, b: any) => b.articleCount - a.articleCount);
    
    // Cache for 10 minutes
    await setCache(cacheKey, categories, 600);
    
    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/categories/:id - Get category details with feeds
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const info = CATEGORY_INFO[id];
    
    if (!info) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    
    const feeds = await (prisma as any).feed.findMany({
      where: {
        category: id,
        isActive: true
      },
      select: {
        id: true,
        title: true,
        displayName: true,
        description: true,
        websiteUrl: true,
        logoUrl: true,
        _count: {
          select: { articles: true }
        }
      },
      orderBy: { title: 'asc' }
    });
    
    res.json({
      category: {
        id,
        ...info,
        feeds,
      }
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

export { router as categoriesRouter };



