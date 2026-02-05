'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, Article, Category } from '@/lib/api';
import { useAuth } from './providers';
import { ArticleCard, ArticleCardSkeleton } from '@/components/features/ArticleCard';
import { CategoryList, CategoryListSkeleton } from '@/components/features/CategoryList';
import { TrendingSection } from '@/components/features/TrendingSection';

function HomeContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const { token } = useAuth();
  
  const [articles, setArticles] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'popularity' | 'recent'>('popularity');

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    }
    fetchCategories();
  }, []);

  // Fetch trending articles
  useEffect(() => {
    async function fetchTrending() {
      setIsTrendingLoading(true);
      try {
        const data = await api.getTrendingArticles();
        setTrending(data.articles);
      } catch (error) {
        console.error('Error fetching trending:', error);
      } finally {
        setIsTrendingLoading(false);
      }
    }
    
    // Only show trending on main page (no category filter)
    if (!categoryParam) {
      fetchTrending();
    } else {
      setTrending([]);
      setIsTrendingLoading(false);
    }
  }, [categoryParam]);

  // Fetch articles
  useEffect(() => {
    async function fetchArticles() {
      setIsLoading(true);
      try {
        const data = await api.getArticles({
          page,
          limit: 12,
          category: categoryParam || undefined,
          sort: sortBy,
        }, token);
        
        setArticles(data.articles || []);
        setTotalPages(data.totalPages);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchArticles();
  }, [page, categoryParam, sortBy, token]);

  // Reset page when category changes
  useEffect(() => {
    setPage(1);
  }, [categoryParam]);

  const selectedCategory = categories.find(c => c.id === categoryParam);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Categories */}
      <section className="mb-6">
        {categories.length === 0 ? (
          <CategoryListSkeleton />
        ) : (
          <CategoryList 
            categories={categories} 
            selectedCategory={categoryParam || undefined}
          />
        )}
      </section>

      {/* Trending Section - Only on main page */}
      {!categoryParam && (
        <TrendingSection articles={trending} isLoading={isTrendingLoading} />
      )}

      {/* Category Header */}
      {selectedCategory && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">{selectedCategory.label}</h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {selectedCategory.articleCount} articles from {selectedCategory.feedCount} sources
          </p>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">
          {categoryParam ? 'Articles' : 'Latest News'}
        </h2>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortBy('popularity')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'popularity'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Popular
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortBy === 'recent'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Recent
          </button>
        </div>
      </div>

      {/* Articles Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No articles found</h3>
          <p className="text-text-secondary-light dark:text-text-secondary-dark">
            {categoryParam 
              ? 'No articles in this category yet. Check back later!'
              : 'Articles will appear here once feeds are fetched.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              
              <span className="px-4 py-2 text-sm">
                Page {page} of {totalPages}
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <CategoryListSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ArticleCardSkeleton key={i} />
          ))}
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
