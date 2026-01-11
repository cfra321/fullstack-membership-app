/**
 * MainLayout Component
 *
 * Main layout wrapper that includes Header and Footer.
 * Used to provide consistent structure across pages.
 */

import { type ReactNode } from 'react';

import { cn } from '../../lib/utils';
import { Header } from './Header';
import { Footer } from './Footer';

/**
 * MainLayout props.
 */
export interface MainLayoutProps {
  /** Page content */
  children: ReactNode;
  /** Show header (default: true) */
  showHeader?: boolean;
  /** Show footer (default: true) */
  showFooter?: boolean;
  /** Additional CSS classes for the main content area */
  className?: string;
  /** Additional CSS classes for the container */
  containerClassName?: string;
}

/**
 * MainLayout Component
 *
 * Provides consistent page structure with optional header and footer.
 *
 * @example
 * // Full layout with header and footer
 * <MainLayout>
 *   <PageContent />
 * </MainLayout>
 *
 * @example
 * // Without header (e.g., for auth pages)
 * <MainLayout showHeader={false}>
 *   <LoginForm />
 * </MainLayout>
 */
export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
  className,
  containerClassName,
}: MainLayoutProps) {
  return (
    <div
      className={cn(
        'flex flex-col min-h-screen bg-gray-50',
        containerClassName
      )}
    >
      {/* Header */}
      {showHeader && <Header />}

      {/* Main Content */}
      <main
        role="main"
        className={cn(
          'flex-1',
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer />}
    </div>
  );
}

export default MainLayout;
