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
  const [likeCount, setLikeCount] = useState(article.analytics?.likeCount || 0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);

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

  if (variant === 'featured') {
    return (
      <Link href={`/article/${article.id}`}>
        <article className="group relative h-80 rounded-2xl overflow-hidden glass-card-hover">
          {/* Background Image */}
          {article.imageUrl && (
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${article.imageUrl})` }}
            />
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            {/* Provider */}
            <div className="flex items-center gap-2 mb-2">
              {article.category && (
                <span className={cn('badge', getCategoryClass(article.category))}>
                  {article.category}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm font-medium text-blue-300">
                <Newspaper className="w-4 h-4" />
                {article.providerName}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 line-clamp-2 group-hover:text-primary-300 transition-colors">
              {article.title}
            </h2>
            
            <p className="text-sm text-gray-300 line-clamp-2 mb-3">
              {article.summary}
            </p>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">
                {formatDate(article.publishedAt)}
              </span>
              
              <div className="flex items-center gap-3">
                {article.analytics && (
                  <span className="flex items-center gap-1 text-sm text-gray-400">
                    <Eye className="w-4 h-4" />
                    {formatNumber(article.analytics.viewCount)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link href={`/article/${article.id}`}>
        <article className="group flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          {/* Thumbnail */}
          {article.imageUrl && (
            <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* Provider */}
            <div className="flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 mb-1">
              <Newspaper className="w-3 h-3" />
              {article.providerName}
            </div>
            
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {article.title}
            </h3>
            
            <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              {formatDate(article.publishedAt)}
            </span>
          </div>
        </article>
      </Link>
    );
  }

  // Default variant
  return (
    <Link href={`/article/${article.id}`}>
      <article className="article-card group animate-fade-in">
        {/* Image */}
        {article.imageUrl && (
          <div className="relative -mx-4 -mt-4 mb-4 h-48 overflow-hidden rounded-t-xl">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* Category Badge */}
            {article.category && (
              <span className={cn('absolute top-3 left-3 badge', getCategoryClass(article.category))}>
                {article.category}
              </span>
            )}
          </div>
        )}
        
        {/* Provider - ALWAYS VISIBLE */}
        <div className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400 mb-2">
          <Newspaper className="w-4 h-4" />
          {article.providerName}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-lg mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          {article.title}
        </h3>
        
        {/* Summary */}
        {article.summary && (
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm line-clamp-2 mb-3">
            {article.summary}
          </p>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 text-sm text-text-secondary-light dark:text-text-secondary-dark">
            <span>{formatDate(article.publishedAt)}</span>
            {article.author && (
              <span className="hidden sm:inline">· {article.author}</span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Views */}
            <span className="flex items-center gap-1 text-xs text-gray-400 mr-2">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(article.analytics?.viewCount || 0)}
            </span>
            
            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={cn(
                'btn-icon p-1.5 transition-all',
                isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'text-gray-400 hover:text-red-500',
                !user && 'opacity-50 cursor-not-allowed'
              )}
              title={user ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
            >
              <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
            </button>
            
            {/* Bookmark Button */}
            <button
              onClick={handleBookmark}
              disabled={!user || isBookmarking}
              className={cn(
                'btn-icon p-1.5 transition-all',
                isBookmarked 
                  ? 'text-primary-500 hover:text-primary-600' 
                  : 'text-gray-400 hover:text-primary-500',
                !user && 'opacity-50 cursor-not-allowed'
              )}
              title={user ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
            >
              <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
            </button>
            
            {/* External Link */}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="btn-icon p-1.5 text-gray-400 hover:text-primary-500"
              title={`Read on ${article.providerName}`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
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
    <div className="glass-card p-4 space-y-4">
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
