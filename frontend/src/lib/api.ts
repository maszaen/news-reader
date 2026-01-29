// API Client for Reapublix Backend

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface Article {
  id: string;
  title: string;
  summary: string | null;
  content: string | null;
  author: string | null;
  imageUrl: string | null;
  url: string;
  publishedAt: string;
  providerName: string;
  providerUrl: string | null;
  category?: string;
  feed?: {
    id: string;
    displayName: string;
    category: string;
    logoUrl: string | null;
  };
  analytics?: {
    viewCount: number;
    likeCount: number;
    bookmarkCount: number;
    popularityScore: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Feed {
  id: string;
  title: string;
  displayName: string;
  description: string | null;
  category: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  feedUrl: string;
  _count?: {
    articles: number;
  };
}

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  feedCount: number;
  articleCount: number;
}

export interface PaginatedResponse<T> {
  articles?: T[];
  feeds?: T[];
  likes?: T[];
  bookmarks?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  fromCache?: boolean;
}

// Helper to get auth header
function getAuthHeaders(token?: string | null): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

// API Client
export const api = {
  // Articles
  async getArticles(params?: {
    page?: number;
    limit?: number;
    category?: string;
    feedId?: string;
    sort?: 'popularity' | 'recent' | 'views';
  }, token?: string | null): Promise<PaginatedResponse<Article>> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.feedId) query.set('feedId', params.feedId);
    if (params?.sort) query.set('sort', params.sort);
    
    const res = await fetch(`${API_URL}/api/articles?${query}`, {
      headers: getAuthHeaders(token),
      cache: 'no-store',
    });
    
    if (!res.ok) throw new Error('Failed to fetch articles');
    return res.json();
  },

  async getTrendingArticles(): Promise<{ articles: Article[] }> {
    const res = await fetch(`${API_URL}/api/articles/trending`);
    if (!res.ok) throw new Error('Failed to fetch trending articles');
    return res.json();
  },

  async getArticle(id: string, token?: string | null): Promise<{ article: Article }> {
    const res = await fetch(`${API_URL}/api/articles/${id}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch article');
    return res.json();
  },

  async trackView(articleId: string): Promise<void> {
    await fetch(`${API_URL}/api/articles/${articleId}/view`, {
      method: 'POST',
    });
  },

  async likeArticle(articleId: string, token: string): Promise<{ success: boolean; liked: boolean }> {
    const res = await fetch(`${API_URL}/api/articles/${articleId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to like article');
    }
    return res.json();
  },

  async unlikeArticle(articleId: string, token: string): Promise<{ success: boolean; liked: boolean }> {
    const res = await fetch(`${API_URL}/api/articles/${articleId}/like`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to unlike article');
    }
    return res.json();
  },

  async bookmarkArticle(articleId: string, token: string, notes?: string): Promise<{ success: boolean; bookmarked: boolean }> {
    const res = await fetch(`${API_URL}/api/articles/${articleId}/bookmark`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to bookmark article');
    }
    return res.json();
  },

  async removeBookmark(articleId: string, token: string): Promise<{ success: boolean; bookmarked: boolean }> {
    const res = await fetch(`${API_URL}/api/articles/${articleId}/bookmark`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to remove bookmark');
    }
    return res.json();
  },

  // Feeds
  async getFeeds(): Promise<{ feeds: Feed[] }> {
    const res = await fetch(`${API_URL}/api/feeds`);
    if (!res.ok) throw new Error('Failed to fetch feeds');
    return res.json();
  },

  async getFeed(id: string): Promise<{ feed: Feed & { articles: Article[] } }> {
    const res = await fetch(`${API_URL}/api/feeds/${id}`);
    if (!res.ok) throw new Error('Failed to fetch feed');
    return res.json();
  },

  // Categories
  async getCategories(): Promise<{ categories: Category[] }> {
    const res = await fetch(`${API_URL}/api/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  async getCategory(id: string): Promise<{ category: Category & { feeds: Feed[] } }> {
    const res = await fetch(`${API_URL}/api/categories/${id}`);
    if (!res.ok) throw new Error('Failed to fetch category');
    return res.json();
  },

  // User
  async getUserLikes(token: string, page = 1): Promise<PaginatedResponse<Article>> {
    const res = await fetch(`${API_URL}/api/user/likes?page=${page}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch likes');
    return res.json();
  },

  async getUserBookmarks(token: string, page = 1): Promise<PaginatedResponse<Article>> {
    const res = await fetch(`${API_URL}/api/user/bookmarks?page=${page}`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch bookmarks');
    return res.json();
  },
};
