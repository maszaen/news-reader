'use client';

import Link from 'next/link';
import { 
  Newspaper, 
  Cpu, 
  TrendingUp, 
  Trophy, 
  Film, 
  Atom, 
  Heart, 
  Briefcase,
  Rss 
} from 'lucide-react';
import { Category } from '@/lib/api';
import { formatNumber, cn } from '@/lib/utils';

// Icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  Newspaper: <Newspaper className="w-5 h-5" />,
  Cpu: <Cpu className="w-5 h-5" />,
  TrendingUp: <TrendingUp className="w-5 h-5" />,
  Trophy: <Trophy className="w-5 h-5" />,
  Film: <Film className="w-5 h-5" />,
  Atom: <Atom className="w-5 h-5" />,
  Heart: <Heart className="w-5 h-5" />,
  Briefcase: <Briefcase className="w-5 h-5" />,
  Rss: <Rss className="w-5 h-5" />,
};

interface CategoryListProps {
  categories: Category[];
  selectedCategory?: string;
  variant?: 'horizontal' | 'vertical' | 'grid';
}

export function CategoryList({ 
  categories, 
  selectedCategory,
  variant = 'horizontal' 
}: CategoryListProps) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className="space-y-2">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
            !selectedCategory
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          )}
        >
          <Rss className="w-5 h-5" />
          <span className="font-medium">All</span>
        </Link>
        
        {categories.map((category) => {
          const isSelected = selectedCategory === category.id;
          const Icon = categoryIcons[category.icon] || <Rss className="w-5 h-5" />;
          
          return (
            <Link
              key={category.id}
              href={`/?category=${category.id}`}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                isSelected
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              )}
            >
              <span style={{ color: category.color }}>{Icon}</span>
              <span className="font-medium flex-1">{category.label}</span>
              <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {formatNumber(category.articleCount)}
              </span>
            </Link>
          );
        })}
      </div>
    );
  }

  // Horizontal (default)
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
      <Link
        href="/"
        className={cn(
          'flex-shrink-0 px-4 py-2 rounded-full font-medium text-sm transition-all',
          !selectedCategory
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
        )}
      >
        All
      </Link>
      
      {categories.map((category) => {
        const isSelected = selectedCategory === category.id;
        
        return (
          <Link
            key={category.id}
            href={`/?category=${category.id}`}
            className={cn(
              'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all',
              isSelected
                ? 'text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
            style={isSelected ? { backgroundColor: category.color } : undefined}
          >
            {categoryIcons[category.icon]}
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}

// Individual category card (for grid view)
function CategoryCard({ category }: { category: Category }) {
  const Icon = categoryIcons[category.icon] || <Rss className="w-6 h-6" />;
  
  return (
    <Link
      href={`/?category=${category.id}`}
      className="glass-card-hover p-5 text-center group"
    >
      <div 
        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
        style={{ backgroundColor: category.color }}
      >
        {Icon}
      </div>
      <h3 className="font-semibold mb-1">{category.label}</h3>
      <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
        {formatNumber(category.articleCount)} articles
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {category.feedCount} feeds
      </p>
    </Link>
  );
}

// Skeleton loading
export function CategoryListSkeleton({ variant = 'horizontal' }: { variant?: 'horizontal' | 'vertical' | 'grid' }) {
  if (variant === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card p-5 space-y-3">
            <div className="w-12 h-12 mx-auto skeleton rounded-xl" />
            <div className="h-4 w-20 mx-auto skeleton" />
            <div className="h-3 w-16 mx-auto skeleton" />
          </div>
        ))}
      </div>
    );
  }
  
  if (variant === 'vertical') {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="w-5 h-5 skeleton rounded" />
            <div className="flex-1 h-4 skeleton" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="flex gap-2 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-9 w-24 skeleton rounded-full" />
      ))}
    </div>
  );
}
