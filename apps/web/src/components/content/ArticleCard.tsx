/**
 * Article Card Component
 *
 * Displays an article preview with access status indicator.
 */

import Link from 'next/link';

import { formatDate, truncate } from '../../lib/utils';

/**
 * Article preview data.
 */
export interface ArticlePreview {
  id: string;
  title: string;
  preview: string;
  coverImage?: string;
  author: string;
  publishedAt: string;
}

/**
 * Props for ArticleCard component.
 */
export interface ArticleCardProps {
  /** Article data */
  article: ArticlePreview;
  /** Whether the user has already accessed this article */
  isAccessed: boolean;
}

/**
 * Article Card Component
 *
 * Displays an article preview card with:
 * - Cover image (if available)
 * - Title and preview text
 * - Author and publish date
 * - Access status indicator (Accessed/New)
 *
 * @example
 * <ArticleCard
 *   article={{
 *     id: '123',
 *     title: 'Getting Started',
 *     preview: 'Learn the basics...',
 *     author: 'John Doe',
 *     publishedAt: '2024-01-15T10:00:00Z',
 *   }}
 *   isAccessed={true}
 * />
 */
export function ArticleCard({ article, isAccessed }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
    >
      {/* Cover image */}
      {article.coverImage && (
        <div className="aspect-video bg-gray-100 overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {/* Status badge */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {article.author} • {formatDate(article.publishedAt, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {isAccessed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Accessed
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              New
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
          {article.title}
        </h3>

        {/* Preview */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {truncate(article.preview, 150)}
        </p>
      </div>
    </Link>
  );
}

export default ArticleCard;
