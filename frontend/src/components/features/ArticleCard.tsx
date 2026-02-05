'use client';

import Link from 'next/link';
import { Newspaper, ExternalLink, Eye, Heart, Bookmark } from 'lucide-react';
import { Article } from '@/lib/api';
import { formatDate, formatNumber, getCategoryClass, cn } from '@/lib/utils';
import { useAuth } from '@/app/providers';
import { useState } from 'react';
import { api } from '@/lib/api';

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'compact' | 'featured';
  onLikeChange?: (articleId: string, isLiked: boolean) => void;
  onBookmarkChange?: (articleId: string, isBookmarked: boolean) => void;
}

export function ArticleCard({ 
  article, 
  variant = 'default',
  onLikeChange,
  onBookmarkChange 
}: ArticleCardProps) {
  const { user, token } = useAuth();
  const [isLiked, setIsLiked] = useState(article.isLiked || false);
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked || false);
  const [imageError, setImageError] = useState(false);
  const [likeCount, setLikeCount] = useState<number>(article.analytics?.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

  // ... handlers (keep existing logic, omitted for brevity in thought but included in output if I were writing full file. 
  // Wait, replace_file_content requires the Full Content of the block I am replacing if I replace a large chunk.
  // I will assume the handlers are fine and just replace the render part? 
  // The user wanted "everything" redesigned.
  // I'll re-implement the handlers to be safe and clean.
  
  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token || isLiking) return;
    setIsLiking(true);
    try {
      if (isLiked) {
        await api.unlikeArticle(article.id, token);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
        onLikeChange?.(article.id, false);
      } else {
        await api.likeArticle(article.id, token);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        onLikeChange?.(article.id, true);
      }
    } catch (error) {
      console.error('Like error:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !token || isBookmarking) return;
    setIsBookmarking(true);
    try {
      if (isBookmarked) {
        await api.removeBookmark(article.id, token);
        setIsBookmarked(false);
        onBookmarkChange?.(article.id, false);
      } else {
        await api.bookmarkArticle(article.id, token);
        setIsBookmarked(true);
        onBookmarkChange?.(article.id, true);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setIsBookmarking(false);
    }
  };

  // Fallback for missing/error images
  const ImageFallback = () => (
    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
      <Newspaper className="w-8 h-8 text-gray-300 dark:text-gray-600" />
    </div>
  );

  if (variant === 'featured') {
    return (
      <Link href={`/article/${article.id}`} className="block h-full">
        <article className="group relative h-[28rem] lg:h-full rounded-2xl overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all duration-300 border-0 shadow-xl ring-1 ring-black/5">
          {article.imageUrl && !imageError ? (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105 will-change-transform"
              style={{ backgroundImage: `url(${article.imageUrl})` }}
              onError={() => setImageError(true)}
            />
          ) : (
            <ImageFallback />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-90" />
          
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              {article.category && (
                <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full backdrop-blur-md bg-white/10 text-white border border-white/20', getCategoryClass(article.category))}>
                  {article.category}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-sm font-medium text-gray-200/90 tracking-wide">
                <Newspaper className="w-4 h-4" />
                {article.providerName}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight tracking-tight group-hover:text-primary-300 transition-colors">
              {article.title}
            </h2>
            
            <p className="text-base text-gray-300 line-clamp-2 mb-6 max-w-2xl leading-relaxed">
              {article.summary}
            </p>
            
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm font-medium text-gray-300">
                {formatDate(article.publishedAt)}
              </span>
              
              {article.analytics && (
                <span className="flex items-center gap-1.5 text-sm text-gray-300">
                  <Eye className="w-4 h-4" />
                  {formatNumber(article.analytics.viewCount)} reads
                </span>
              )}
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/article/${article.id}`} className="block">
        <article className="group flex gap-4 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative shadow-sm">
            {article.imageUrl && !imageError ? (
              <img
                src={article.imageUrl}
                alt=""
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <ImageFallback />
            )}
          </div>
          
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {article.providerName}
              </span>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <span className="text-[10px] text-text-secondary-light dark:text-text-secondary-dark font-medium">
                {formatDate(article.publishedAt)}
              </span>
            </div>
            
            <h3 className="font-bold text-sm leading-snug text-gray-900 dark:text-gray-100 mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
              {article.title}
            </h3>
            
            {article.category && (
               <div className="mt-1">
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400')}>
                    {article.category}
                  </span>
               </div>
            )}
          </div>
        </article>
      </Link>
    );
  }

  // Default Vertical Card (Professional Grid)
  return (
    <Link href={`/article/${article.id}`} className="block h-full">
      <article className="group flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-md hover:scale-[1.01] transition-all duration-300 cursor-pointer">
        {/* Image Container - Aspect Ratio 16:9 for consistency */}
        <div className="relative w-full aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
           {article.imageUrl && !imageError ? (
            <img
              src={article.imageUrl}
              alt=""
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
             <ImageFallback />
          )}
          
          {/* Category Floating Badge */}
          {article.category && (
            <span className={cn('absolute top-3 left-3 shadow-sm backdrop-blur-md', getCategoryClass(article.category))}>
              {article.category}
            </span>
          )}
        </div>
        
        {/* Content Body */}
        <div className="flex-1 p-5 flex flex-col">
          {/* Metadata Row */}
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                <Newspaper className="w-3.5 h-3.5" />
                {article.providerName}
             </div>
             <span className="text-xs text-gray-400 font-medium">
                {formatDate(article.publishedAt)}
             </span>
          </div>

          {/* Title - Fixed Height for 2 lines */}
          <h3 className="font-bold text-lg mb-3 leading-snug text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3.5rem] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {article.title}
          </h3>
          
          {/* Summary - Fill available space but clamp */}
          {article.summary && (
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4 flex-1">
              {article.summary}
            </p>
          )}
          
          {/* Footer Actions */}
          <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
               <button
                  onClick={handleLike}
                  disabled={!user || isLiking}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors p-1 -ml-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800',
                    isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  )}
                >
                  <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
                  <span>{formatNumber(likeCount)}</span>
                </button>
                
                <button
                  onClick={handleBookmark}
                  disabled={!user || isBookmarking}
                  className={cn(
                    'flex items-center gap-1.5 text-xs font-medium transition-colors p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800',
                    isBookmarked ? 'text-primary-500' : 'text-gray-400 hover:text-primary-500'
                  )}
                >
                  <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
                </button>
            </div>

            {article.analytics && (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                {formatNumber(article.analytics.viewCount)}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}

// Skeleton loading state
export function ArticleCardSkeleton({ variant = 'default' }: { variant?: 'default' | 'compact' | 'featured' }) {
  if (variant === 'featured') {
    return (
      <div className="h-80 rounded-2xl skeleton" />
    );
  }
  
  if (variant === 'compact') {
    return (
      <div className="flex gap-4 p-3">
        <div className="w-20 h-20 rounded-lg skeleton" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-20 skeleton" />
          <div className="h-4 w-full skeleton" />
          <div className="h-3 w-24 skeleton" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 border border-gray-200/50 dark:border-gray-700/50 rounded-xl shadow-sm backdrop-blur-lg p-4 space-y-4">
      <div className="h-48 -mx-4 -mt-4 skeleton rounded-t-xl" />
      <div className="h-4 w-24 skeleton" />
      <div className="h-6 w-full skeleton" />
      <div className="h-4 w-full skeleton" />
      <div className="h-4 w-2/3 skeleton" />
      <div className="flex justify-between pt-3">
        <div className="h-4 w-24 skeleton" />
        <div className="h-4 w-20 skeleton" />
      </div>
    </div>
  );
}
