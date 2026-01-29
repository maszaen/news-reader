'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Grid } from 'lucide-react';
import { api, Category } from '@/lib/api';
import { CategoryList, CategoryListSkeleton } from '@/components/features/CategoryList';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const data = await api.getCategories();
        setCategories(data.categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return (
    <div className="container-wide py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:underline mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Grid className="w-8 h-8 text-primary-500" />
          All Categories
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">
          Browse news by category
        </p>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <CategoryListSkeleton variant="grid" />
      ) : (
        <CategoryList categories={categories} variant="grid" />
      )}
    </div>
  );
}
