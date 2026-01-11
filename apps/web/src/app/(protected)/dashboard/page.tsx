'use client';

/**
 * Dashboard Page
 *
 * Main dashboard showing user info and usage statistics.
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '../../../components/auth';
import { UsageDisplay } from '../../../components/content';
import { useUsage } from '../../../hooks/useUsage';
import { getMembershipDisplayName, getInitials } from '../../../lib/utils';

/**
 * Get membership tier label with description.
 */
function getMembershipLabel(type: 'A' | 'B' | 'C'): { name: string; description: string } {
  const labels: Record<'A' | 'B' | 'C', { name: string; description: string }> = {
    A: { name: 'Basic', description: 'Access to 3 articles and 3 videos' },
    B: { name: 'Premium', description: 'Access to 10 articles and 10 videos' },
    C: { name: 'Unlimited', description: 'Unlimited access to all content' },
  };
  return labels[type];
}

/**
 * Loading State Component
 */
function LoadingState() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-24 bg-gray-200 rounded" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
        <p className="text-center text-gray-500 mt-4">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">Error: {message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Dashboard Page Component
 *
 * Displays:
 * - Welcome message with user name
 * - Membership type badge
 * - Usage statistics for articles and videos
 * - Navigation links to content pages
 * - Logout button
 */
export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { usage, isLoading, error } = useUsage();

  /**
   * Handle logout button click.
   */
  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  // Show loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Show error state
  if (error) {
    return <ErrorState message={error} />;
  }

  // Shouldn't happen due to protected layout, but handle gracefully
  if (!user) {
    return <ErrorState message="User not found" />;
  }

  const membership = getMembershipLabel(user.membershipType);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold">
              {getInitials(user.displayName)}
            </div>

            {/* User info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome, {user.displayName}
              </h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
          >
            Sign Out
          </button>
        </div>

        {/* Membership badge */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">
                Membership
              </h2>
              <p className="text-gray-600">{membership.description}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              user.membershipType === 'C'
                ? 'bg-purple-100 text-purple-800'
                : user.membershipType === 'B'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {membership.name}
            </span>
          </div>
        </div>

        {/* Usage Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Your Usage
          </h2>
          {usage && (
            <UsageDisplay
              articles={{ count: usage.articles.count, limit: usage.articles.limit }}
              videos={{ count: usage.videos.count, limit: usage.videos.limit }}
            />
          )}
        </div>

        {/* Content Navigation */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Explore Content
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Articles link */}
            <Link
              href="/articles"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                    Browse Articles
                  </h3>
                  <p className="text-sm text-gray-500">
                    {usage ? `${usage.articles.remaining} remaining` : 'View all articles'}
                  </p>
                </div>
              </div>
            </Link>

            {/* Videos link */}
            <Link
              href="/videos"
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                    Watch Videos
                  </h3>
                  <p className="text-sm text-gray-500">
                    {usage ? `${usage.videos.remaining} remaining` : 'View all videos'}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
