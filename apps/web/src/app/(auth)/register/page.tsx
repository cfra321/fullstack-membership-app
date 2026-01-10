'use client';

/**
 * Registration Page
 *
 * Displays the registration form for new users.
 */

import Link from 'next/link';

import { RegisterForm } from '../../../components/auth';

/**
 * Registration Page Component
 *
 * Renders the registration page with:
 * - Registration form with email, display name, and password
 * - Link to login page for existing users
 */
export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create an Account
          </h1>
          <p className="mt-2 text-gray-600">
            Join us and start exploring exclusive content
          </p>
        </div>

        {/* Card container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Registration form */}
          <RegisterForm />
        </div>

        {/* Login link */}
        <p className="text-center text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
