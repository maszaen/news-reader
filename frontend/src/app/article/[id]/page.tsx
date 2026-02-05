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
      <div className="max-w-4xl mx-auto px-4 py-8">
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6 font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2">Article not found</h2>
          <p className="text-gray-500 dark:text-gray-400">
            The article you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <Link 
        href="/" 
        className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Hero Image */}
      {article.imageUrl && (
        <div className="relative -mx-4 sm:mx-0 mb-8 rounded-2xl overflow-hidden shadow-lg">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-64 sm:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Category Badge */}
      {article.category && (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border mb-6 uppercase tracking-wider', getCategoryClass(article.category))}>
          {article.category}
        </span>
      )}

      {/* Title */}
      <h1 className="text-3xl sm:text-5xl font-bold mb-6 leading-tight text-gray-900 dark:text-gray-50">
        {article.title}
      </h1>

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 dark:text-gray-400 mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
        {/* Provider - Always visible */}
        <a 
          href={article.providerUrl || article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 hover:underline"
        >
          <Newspaper className="w-4 h-4" />
          {article.providerName}
        </a>
        
        {/* Author */}
        {article.author && (
          <span className="flex items-center gap-2 font-medium">
            <User className="w-4 h-4" />
            {article.author}
          </span>
        )}
        
        {/* Date */}
        <span className="flex items-center gap-2 font-medium">
          <Clock className="w-4 h-4" />
          {formatDate(article.publishedAt)}
        </span>
        
        {/* Views */}
        {article.analytics && (
          <span className="flex items-center gap-2 font-medium">
            <Eye className="w-4 h-4" />
            {formatNumber(article.analytics.viewCount)} views
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-8 sticky top-20 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl p-2 rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm w-full sm:w-[480px]">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={!user}
          className={cn(
            'flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg font-bold transition-all active:scale-95 w-full',
            isLiked 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            !user && 'opacity-50 cursor-not-allowed'
          )}
          title={user ? (isLiked ? 'Unlike' : 'Like') : 'Sign in to like'}
        >
          <Heart className={cn('w-4 h-4', isLiked && 'fill-current')} />
          <span>{likeCount > 0 ? formatNumber(likeCount) : (isLiked ? 'Liked' : 'Like')}</span>
        </button>

        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          disabled={!user}
          className={cn(
            'flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg font-bold transition-all active:scale-95 w-full',
            isBookmarked 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
            !user && 'opacity-50 cursor-not-allowed'
          )}
          title={user ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
        >
          <Bookmark className={cn('w-4 h-4', isBookmarked && 'fill-current')} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>

        {/* Share */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 px-2 py-2.5 rounded-lg font-bold transition-all active:scale-95 w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>
      </div>

      {/* Summary */}
      {article.summary && (
        <div className="mb-10 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/20">
          <p className="text-xl leading-relaxed text-gray-700 dark:text-gray-300 font-medium italic text-justify">
            "{article.summary}"
          </p>
        </div>
      )}

      {/* Content */}
      {article.content && (
        <div 
          className="prose prose-lg dark:prose-invert max-w-none mb-12 prose-headings:font-bold prose-headings:tracking-tight prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-xl text-justify leading-loose prose-p:mb-6 prose-li:my-2"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      )}

      {/* Read Original CTA */}
      <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg font-medium">
          Read the full article on {article.providerName}
        </p>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-blue-500/25 active:scale-95 text-lg"
        >
          <ExternalLink className="w-5 h-5" />
          Read on {article.providerName}
        </a>
      </div>
    </article>
  );
}
