/**
 * Home Page
 *
 * Landing page that redirects to login or dashboard.
 */

import Link from 'next/link';

import { PACKAGE_NAME } from '@astronacci/shared';

export default function Home() {
  return (
    <main className="flex min-h-screen">
      {/* Left side - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between">
        <div>
          {/* Logo/Icon */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-white">Astronacci</span>
          </div>

          {/* Features */}
          <div className="space-y-6 mt-16">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Exclusive Articles</h3>
                <p className="text-blue-100 text-sm">Access premium content from industry experts</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Video Tutorials</h3>
                <p className="text-blue-100 text-sm">Learn from comprehensive video courses</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Tiered Membership</h3>
                <p className="text-blue-100 text-sm">Choose the plan that fits your needs</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-blue-100 text-sm">
          Powered by {PACKAGE_NAME}
        </p>
      </div>

      {/* Right side - Auth */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-900">Astronacci</span>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Astronacci Membership
            </h1>
            <p className="text-gray-600 mb-8">
              Access exclusive articles and videos with your membership
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 space-y-4">
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

          <p className="text-center text-sm text-gray-500">
            Join thousands of members accessing premium content
          </p>
        </div>
      </div>
    </main>
  );
}
