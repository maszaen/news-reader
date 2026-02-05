'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/providers';
import { api, Article } from '@/lib/api';
import { ArticleCard, ArticleCardSkeleton } from '@/components/features/ArticleCard';

export default function LikesPage() {
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
    async function fetchLikes() {
      if (!token) return;
      
      setIsLoading(true);
      try {
        const data = await api.getUserLikes(token, page);
        setArticles(data.likes || []);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (token) {
      fetchLikes();
    }
  }, [token, page]);

  const handleLikeChange = (articleId: string, isLiked: boolean) => {
    if (!isLiked) {
      setArticles(prev => prev.filter(a => a.id !== articleId));
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <Heart className="w-8 h-8 text-red-500 fill-current" />
            Liked Articles
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Articles you've shown some love to
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
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
          <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
          <h2 className="text-xl font-semibold mb-2">No liked articles yet</h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
            Like articles to show appreciation. Your favorites will appear here.
          </p>
          <Link href="/" className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            Browse Articles
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard 
                key={article.id} 
                article={{ ...article, isLiked: true }}
                onLikeChange={handleLikeChange}
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
                      ? 'bg-blue-600 text-white'
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
