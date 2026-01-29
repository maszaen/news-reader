'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart, 
  Bookmark, 
  Share2, 
  Clock,
  User,
  Newspaper,
  Eye
} from 'lucide-react';
import { api, Article } from '@/lib/api';
import { useAuth } from '@/app/providers';
import { formatDate, formatNumber, getCategoryClass, cn } from '@/lib/utils';

export default function ArticlePage() {
  const params = useParams();
  const articleId = params.id as string;
  const { user, token } = useAuth();
  
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    async function fetchArticle() {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await api.getArticle(articleId, token);
        setArticle(data.article);
        setIsLiked(data.article.isLiked || false);
        setIsBookmarked(data.article.isBookmarked || false);
        setLikeCount(data.article.analytics?.likeCount || 0);
        
        // Track view
        await api.trackView(articleId);
      } catch (err) {
        setError('Failed to load article');
        console.error('Error fetching article:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (articleId) {
      fetchArticle();
    }
  }, [articleId, token]);

  const handleLike = async () => {
    if (!user || !token) return;
    
    try {
      if (isLiked) {
        await api.unlikeArticle(articleId, token);
        setIsLiked(false);
        setLikeCount(prev => Math.max(0, prev - 1));
      } else {
        await api.likeArticle(articleId, token);
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Like error:', error);
    }
  };

  const handleBookmark = async () => {
    if (!user || !token) return;
    
    try {
      if (isBookmarked) {
        await api.removeBookmark(articleId, token);
        setIsBookmarked(false);
      } else {
        await api.bookmarkArticle(articleId, token);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const handleShare = async () => {
    if (article && navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.summary || '',
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else if (article) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (isLoading) {
    return (
      <div className="container-readable py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-32 skeleton rounded" />
          <div className="h-64 skeleton rounded-2xl" />
          <div className="h-6 w-24 skeleton rounded" />
          <div className="h-10 w-full skeleton rounded" />
          <div className="h-4 w-48 skeleton rounded" />
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-4 skeleton rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="container-readable py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="text-center py-12 glass-card">
          <h2 className="text-xl font-semibold mb-2">Article not found</h2>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            The article you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="container-readable py-8">
      {/* Back Button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Hero Image */}
      {article.imageUrl && (
        <div className="relative -mx-4 sm:mx-0 mb-6 rounded-2xl overflow-hidden">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-64 sm:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Category Badge */}
      {article.category && (
        <span className={cn('badge mb-4', getCategoryClass(article.category))}>
          {article.category}
        </span>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
        {article.title}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary-light dark:text-text-secondary-dark mb-6">
        {/* Provider - Always visible */}
        <a 
          href={article.providerUrl || article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:underline"
        >
          <Newspaper className="w-4 h-4" />
          Source: {article.providerName}
        </a>
        
        {/* Author */}
        {article.author && (
          <span className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            {article.author}
          </span>
        )}
        
        {/* Date */}
        <span className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          {formatDate(article.publishedAt)}
        </span>
        
        {/* Views */}
        {article.analytics && (
          <span className="flex items-center gap-1.5">
            <Eye className="w-4 h-4" />
            {formatNumber(article.analytics.viewCount)} views
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pb-6 mb-6 border-b border-gray-200 dark:border-gray-700">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!user}
          className={cn(
            'btn-secondary gap-2',
            isLiked && 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            !user && 'opacity-50 cursor-not-allowed'
          )}
          title={user ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
          <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
          {likeCount > 0 && formatNumber(likeCount)}
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={!user}
          className={cn(
            'btn-secondary gap-2',
            isBookmarked && 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
            !user && 'opacity-50 cursor-not-allowed'
          )}
          title={user ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
          {isBookmarked ? 'Saved' : 'Save'}
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="btn-secondary gap-2"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {/* Summary */}
      {article.summary && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-primary-500">
          <p className="text-lg text-text-secondary-light dark:text-text-secondary-dark italic">
            {article.summary}
          </p>
        </div>
      )}

      {/* Content */}
      {article.content && (
        <div 
          className="prose prose-lg dark:prose-invert max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {/* Read Original CTA */}
      <div className="p-6 glass-card text-center">
        <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
          Read the full article on {article.providerName}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex"
        >
          <ExternalLink className="w-4 h-4" />
          Read on {article.providerName}
        </a>
      </div>
    </article>
  );
}
