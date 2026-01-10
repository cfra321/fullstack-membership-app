'use client';

/**
 * Articles List Page
 *
 * Displays a list of all articles with access status indicators.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

import { api } from '../../../lib/api';
import { ArticleCard, type ArticlePreview } from '../../../components/content';
import { formatUsage } from '../../../lib/utils';

/**
 * Articles API response.
 */
interface ArticlesResponse {
  articles: ArticlePreview[];
  usage: {
    articles: {
      count: number;
      limit: number;
      remaining: number;
      accessed: string[];
    };
    videos: {
      count: number;
      limit: number;
      remaining: number;
      accessed: string[];
    };
    membershipType: string;
  };
  accessedIds: string[];
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-200" />
          <div className="p-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-1" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
        <p className="text-red-600 mb-4">Error: {message}</p>
        <button
          onClick={onRetry}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 inline-block">
        <svg
          className="w-16 h-16 text-gray-400 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Articles Available</h3>
        <p className="text-gray-600">Check back later for new content.</p>
      </div>
    </div>
  );
}

/**
 * Quota Warning Component
 */
function QuotaWarning({ remaining, limit }: { remaining: number; limit: number }) {
  if (remaining > 0 || limit === Infinity) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h3 className="font-medium text-yellow-800">Limit Reached</h3>
          <p className="text-sm text-yellow-700 mt-1">
            You&apos;ve accessed all available articles for your membership tier.
            Upgrade your membership to access more content.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 underline"
          >
            View your membership options
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Articles List Page Component
 *
 * Displays a list of articles with:
 * - Article cards with preview information
 * - Access status indicators (accessed vs. new)
 * - Quota usage display
 * - Warning when quota is reached
 */
export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticlePreview[]>([]);
  const [accessedIds, setAccessedIds] = useState<string[]>([]);
  const [usage, setUsage] = useState<{ count: number; limit: number; remaining: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch articles from the API.
   */
  async function fetchArticles() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<ArticlesResponse>('/api/articles');
      if (response.data) {
        setArticles(response.data.articles);
        setAccessedIds(response.data.accessedIds);
        // Extract article-specific usage from nested structure
        if (response.data.usage?.articles) {
          setUsage({
            count: response.data.usage.articles.count,
            limit: response.data.usage.articles.limit,
            remaining: response.data.usage.articles.remaining,
          });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch articles';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch articles on mount
  useEffect(() => {
    fetchArticles();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Articles</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Explore our collection of articles
            </p>
          </div>

          {/* Quota display */}
          {usage && (
            <div className="sm:text-right">
              <span className="text-sm text-gray-500">Your usage</span>
              <p className="text-base sm:text-lg font-semibold text-gray-900">
                {formatUsage(usage.count, usage.limit)}
              </p>
              {usage.remaining > 0 && usage.limit !== Infinity && (
                <span className="text-sm text-gray-500">
                  {usage.remaining} remaining
                </span>
              )}
            </div>
          )}
        </div>

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Quota warning */}
        {usage && <QuotaWarning remaining={usage.remaining} limit={usage.limit} />}

        {/* Content */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchArticles} />
        ) : articles.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                isAccessed={accessedIds.includes(article.id)}
              />
            ))}
          </div>
        )}

        {/* Loading text for accessibility */}
        {isLoading && (
          <p className="sr-only">Loading articles...</p>
        )}
        {isLoading && (
          <p className="text-center text-gray-500 mt-4">Loading...</p>
        )}
      </div>
    </div>
  );
}
