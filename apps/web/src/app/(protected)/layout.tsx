'use client';

/**
 * Protected Layout
 *
 * Layout component that gates access to protected routes.
 * Redirects unauthenticated users to the login page.
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { useAuth } from '../../components/auth';

/**
 * Props for the protected layout.
 */
interface ProtectedLayoutProps {
  children: React.ReactNode;
}

/**
 * Loading Spinner Component
 *
 * Displays a centered loading spinner.
 */
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div
        role="status"
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-gray-600">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Protected Layout Component
 *
 * Wraps protected pages to ensure authentication.
 * - Shows loading spinner while checking auth state
 * - Redirects to login if not authenticated
 * - Preserves redirect URL for post-login navigation
 * - Renders children if authenticated
 */
export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Skip redirect while still loading
    if (isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Don't render children while redirecting
  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  // Render children for authenticated users
  return <>{children}</>;
}
