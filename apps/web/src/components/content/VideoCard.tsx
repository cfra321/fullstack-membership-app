/**
 * Video Card Component
 *
 * Displays a video preview with thumbnail, duration, and access status.
 */

import Link from 'next/link';

import { formatDuration, truncate } from '../../lib/utils';

/**
 * Video preview data.
 */
export interface VideoPreview {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  author: string;
  publishedAt: string;
}

/**
 * Props for VideoCard component.
 */
export interface VideoCardProps {
  /** Video data */
  video: VideoPreview;
  /** Whether the user has already watched this video */
  isAccessed: boolean;
}

/**
 * Video Card Component
 *
 * Displays a video preview card with:
 * - Thumbnail with play button overlay
 * - Duration badge
 * - Title and description
 * - Author info
 * - Access status indicator (Watched/New)
 *
 * @example
 * <VideoCard
 *   video={{
 *     id: '123',
 *     title: 'Getting Started',
 *     description: 'Learn the basics...',
 *     thumbnail: '/images/video.jpg',
 *     duration: 1800,
 *     author: 'John Doe',
 *     publishedAt: '2024-01-15T10:00:00Z',
 *   }}
 *   isAccessed={false}
 * />
 */
export function VideoCard({ video, isAccessed }: VideoCardProps) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
            <svg
              className="w-6 h-6 text-gray-900 ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-xs font-medium">
          {formatDuration(video.duration)}
        </div>

        {/* Watched badge */}
        {isAccessed && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded bg-green-600 text-white text-xs font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Watched
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status badge for unwatched */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">
            {video.author}
          </span>
          {!isAccessed && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              New
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors mb-2">
          {video.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {truncate(video.description, 120)}
        </p>
      </div>
    </Link>
  );
}

export default VideoCard;
