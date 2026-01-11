/**
 * Home Page
 *
 * Landing page that redirects to login or dashboard.
 */

import Link from 'next/link';

import { PACKAGE_NAME } from '@astronacci/shared';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="card max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Astronacci Membership
        </h1>
        <p className="text-gray-600 mb-6">
          Access exclusive articles and videos with your membership
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="btn btn-primary w-full block text-center"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="btn btn-secondary w-full block text-center"
          >
            Create Account
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">
          Powered by {PACKAGE_NAME}
        </p>
      </div>
    </main>
  );
}
