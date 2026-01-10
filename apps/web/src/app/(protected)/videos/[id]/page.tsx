'use client';

/**
 * Video Detail Page
 *
 * Displays video player or upgrade prompt if quota exceeded.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { api, ApiError } from '../../../../lib/api';
import { VideoPlayer, UpgradePrompt } from '../../../../components/content';
import { formatDate, formatDuration } from '../../../../lib/utils';

/**
 * Full video data.
 */
interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: number;
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
  | { type: 'success'; video: Video }
  | { type: 'quota_exceeded'; details: QuotaDetails }
  | { type: 'not_found' }
  | { type: 'error'; message: string };

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="aspect-video bg-gray-200 rounded-xl mb-8" />
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
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
      <div className="max-w-4xl mx-auto text-center">
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
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Video Not Found</h2>
          <p className="text-gray-600 mb-6">
            The video you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/videos" className="btn btn-primary">
            Browse Videos
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
      <div className="max-w-4xl mx-auto text-center">
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
 * Video Content Component
 */
function VideoContent({ video }: { video: Video }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Videos
        </Link>

        {/* Video player */}
        <div className="mb-6">
          <VideoPlayer
            src={video.videoUrl}
            poster={video.thumbnail}
            title={video.title}
          />
        </div>

        {/* Video info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {video.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>By {video.author}</span>
              <span>•</span>
              <time dateTime={video.publishedAt}>
                {formatDate(video.publishedAt)}
              </time>
              <span>•</span>
              <span>{formatDuration(video.duration)}</span>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-sm font-medium text-gray-900 mb-2">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {video.description}
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="mt-8 flex justify-between">
          <Link
            href="/videos"
            className="btn btn-secondary"
          >
            Browse More Videos
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
 * Video Detail Page Component
 *
 * Fetches and displays video player.
 * Handles quota exceeded (403) by showing upgrade prompt.
 * Handles not found (404) with appropriate message.
 */
export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [state, setState] = useState<PageState>({ type: 'loading' });

  /**
   * Fetch video from the API.
   */
  async function fetchVideo() {
    setState({ type: 'loading' });

    try {
      const response = await api.get<Video>(`/api/videos/${videoId}`);
      if (response.data) {
        setState({ type: 'success', video: response.data });
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
        const message = err instanceof Error ? err.message : 'Failed to load video';
        setState({ type: 'error', message });
      }
    }
  }

  // Fetch video on mount
  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  // Render based on state
  switch (state.type) {
    case 'loading':
      return <LoadingState />;

    case 'success':
      return <VideoContent video={state.video} />;

    case 'quota_exceeded':
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Videos
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <UpgradePrompt
                contentType="video"
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
      return <ErrorState message={state.message} onRetry={fetchVideo} />;

    default:
      return null;
  }
}
