'use client';

/**
 * Login Page
 *
 * Displays the login form with OAuth and email/password options.
 */

import Link from 'next/link';

import { OAuthButtons, LoginForm } from '../../../components/auth';

/**
 * Login Page Component
 *
 * Renders the login page with:
 * - OAuth buttons (Google, Facebook)
 * - Email/password login form
 * - Link to registration page
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Card container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* OAuth buttons */}
          <OAuthButtons />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/password form */}
          <LoginForm />
        </div>

        {/* Registration link */}
        <p className="text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
