'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bookmark, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { api, Article } from '@/lib/api';
import { ArticleCard, ArticleCardSkeleton } from '@/components/features/ArticleCard';

export default function BookmarksPage() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchBookmarks() {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const data = await api.getUserBookmarks(token, page);
        setArticles(data.bookmarks || []);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching bookmarks:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (token) {
      fetchBookmarks();
    }
  }, [token, page]);

  const handleBookmarkChange = (articleId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      setArticles(prev => prev.filter(a => a.id !== articleId));
    }
  };

  if (authLoading) {
    return (
      <div className="container-wide py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bookmark className="w-8 h-8 text-primary-500" />
            Your Bookmarks
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Articles you've saved for later
          </p>
        </div>
      </div>

      {/* Articles */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 glass-card">
          <Bookmark className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-xl font-semibold mb-2">No bookmarks yet</h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Save articles to read them later. Your bookmarks will appear here.
          </p>
          <Link href="/" className="btn-primary inline-flex">
            Browse Articles
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={{ ...article, isBookmarked: true }}
                onBookmarkChange={handleBookmarkChange}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                    page === i + 1
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
