'use client';

/**
 * Client-side Providers Wrapper
 *
 * Wraps the application with client-side providers like AuthProvider.
 * This component must be a client component since it uses React context.
 */

import { type ReactNode } from 'react';

import { AuthProvider } from './auth/AuthProvider';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return <AuthProvider>{children}</AuthProvider>;
}
