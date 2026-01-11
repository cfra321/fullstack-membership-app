'use client';

/**
 * Article Detail Page
 *
 * Displays full article content or upgrade prompt if quota exceeded.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { api, ApiError } from '../../../../lib/api';
import { UpgradePrompt } from '../../../../components/content';
import { formatDate } from '../../../../lib/utils';

/**
 * Full article data.
 */
interface Article {
  id: string;
  title: string;
  content: string;
  preview: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
}

/**
 * Quota exceeded error details.
 */
interface QuotaDetails {
  currentUsage: number;
  limit: number;
  membershipType: string;
}

/**
 * Page state types.
 */
type PageState =
  | { type: 'loading' }
  | { type: 'success'; article: Article }
  | { type: 'quota_exceeded'; details: QuotaDetails }
  | { type: 'not_found' }
  | { type: 'error'; message: string };

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="aspect-video bg-gray-200 rounded-xl mb-8" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
        <p className="text-center text-gray-500 mt-8">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Not Found State Component
 */
function NotFoundState() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Article Not Found</h2>
          <p className="text-gray-600 mb-6">
            The article you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/articles" className="btn btn-primary">
            Browse Articles
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 mb-4">Error: {message}</p>
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Article Content Component
 */
function ArticleContent({ article }: { article: Article }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/articles"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Articles
        </Link>

        {/* Article */}
        <article className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover image */}
          {article.coverImage && (
            <div className="aspect-video">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-6 md:p-8">
            {/* Header */}
            <header className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>By {article.author}</span>
                <span>•</span>
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </div>
            </header>

            {/* Article body */}
            <div
              className="prose text-gray-900 max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </div>
        </article>

        {/* Footer navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/articles"
            className="btn btn-secondary"
          >
            Browse More Articles
          </Link>
          <Link
            href="/dashboard"
            className="btn btn-secondary"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Article Detail Page Component
 *
 * Fetches and displays article content.
 * Handles quota exceeded (403) by showing upgrade prompt.
 * Handles not found (404) with appropriate message.
 */
export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;

  const [state, setState] = useState<PageState>({ type: 'loading' });

  /**
   * Fetch article from the API.
   */
  async function fetchArticle() {
    setState({ type: 'loading' });

    try {
      const response = await api.get<Article>(`/api/articles/${articleId}`);
      if (response.data) {
        setState({ type: 'success', article: response.data });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 403 && err.code === 'QUOTA_EXCEEDED') {
          setState({
            type: 'quota_exceeded',
            details: err.details as QuotaDetails,
          });
        } else if (err.statusCode === 404) {
          setState({ type: 'not_found' });
        } else {
          setState({ type: 'error', message: err.message });
        }
      } else {
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setState({ type: 'error', message });
      }
    }
  }

  // Fetch article on mount
  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  // Render based on state
  switch (state.type) {
    case 'loading':
      return <LoadingState />;

    case 'success':
      return <ArticleContent article={state.article} />;

    case 'quota_exceeded':
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Articles
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <UpgradePrompt
                contentType="article"
                currentUsage={state.details.currentUsage}
                limit={state.details.limit}
                membershipType={state.details.membershipType}
              />
            </div>
          </div>
        </div>
      );

    case 'not_found':
      return <NotFoundState />;

    case 'error':
      return <ErrorState message={state.message} onRetry={fetchArticle} />;

    default:
      return null;
  }
}
