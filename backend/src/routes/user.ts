import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticateRequired } from '../middleware/auth.js';

const router = Router();

// All user routes require authentication
router.use(authenticateRequired);

// GET /api/user/profile - Get user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            likes: true,
            bookmarks: true,
          }
        }
      }
    });
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/user/likes - Get user's liked articles
router.get('/likes', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    
    const [likes, total] = await Promise.all([
      (prisma as any).userLike.findMany({
        where: { userId: req.user!.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              summary: true,
              imageUrl: true,
              publishedAt: true,
              providerName: true,
              providerUrl: true,
              feed: {
                select: {
                  displayName: true,
                  category: true,
                }
              }
            }
          }
        }
      }),
      (prisma as any).userLike.count({
        where: { userId: req.user!.userId }
      })
    ]);
    
    res.json({
      likes: likes.map((l: any) => ({
        ...l.article,
        likedAt: l.createdAt,
        isLiked: true,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

// GET /api/user/bookmarks - Get user's bookmarked articles
router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    
    const [bookmarks, total] = await Promise.all([
      (prisma as any).userBookmark.findMany({
        where: { userId: req.user!.userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              summary: true,
              imageUrl: true,
              publishedAt: true,
              providerName: true,
              providerUrl: true,
              url: true,
              feed: {
                select: {
                  displayName: true,
                  category: true,
                }
              }
            }
          }
        }
      }),
      (prisma as any).userBookmark.count({
        where: { userId: req.user!.userId }
      })
    ]);
    
    res.json({
      bookmarks: bookmarks.map((b: any) => ({
        ...b.article,
        notes: b.notes,
        bookmarkedAt: b.createdAt,
        isBookmarked: true,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ error: 'Failed to fetch bookmarks' });
  }
});

// GET /api/user/history - Get user's view history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    
    const [views, total] = await Promise.all([
      (prisma as any).articleView.findMany({
        where: { userId: req.user!.userId },
        skip,
        take: limit,
        orderBy: { viewedAt: 'desc' },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              summary: true,
              imageUrl: true,
              publishedAt: true,
              providerName: true,
              feed: {
                select: {
                  displayName: true,
                  category: true,
                }
              }
            }
          }
        }
      }),
      (prisma as any).articleView.count({
        where: { userId: req.user!.userId }
      })
    ]);
    
    // Deduplicate views (show latest view per article)
    const seen = new Set<string>();
    const uniqueViews = views.filter((v: any) => {
      if (seen.has(v.articleId)) return false;
      seen.add(v.articleId);
      return true;
    });
    
    res.json({
      history: uniqueViews.map((v: any) => ({
        ...v.article,
        viewedAt: v.viewedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export { router as userRouter };



