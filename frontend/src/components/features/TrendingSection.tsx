'use client';

import { TrendingUp, Flame } from 'lucide-react';
import { Article } from '@/lib/api';
import { ArticleCard, ArticleCardSkeleton } from './ArticleCard';

interface TrendingSectionProps {
  articles: Article[];
  isLoading?: boolean;
}

export function TrendingSection({ articles, isLoading }: TrendingSectionProps) {
  if (isLoading) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold">Trending Now</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ArticleCardSkeleton variant="featured" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <ArticleCardSkeleton key={i} variant="compact" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  const [featured, ...rest] = articles;

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white animate-pulse-soft">
          <Flame className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold">Trending Now</h2>
        <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Most popular this week
        </span>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:h-[28rem]">
        {/* Featured Article */}
        {featured && (
          <div className="h-full">
            <ArticleCard article={featured} variant="featured" />
          </div>
        )}
        
        {/* Rest of trending */}
        <div className="flex flex-col justify-between gap-3 h-full overflow-hidden">
          {rest.slice(0, 4).map((article, index) => (
            <div key={article.id} className="flex-1 flex items-center gap-4 group/item p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700/50">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-sm font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                {index + 2}
              </span>
              <div className="flex-1 min-w-0">
                <ArticleCard article={article} variant="compact" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
