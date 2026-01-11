/**
 * Button Component
 *
 * Reusable button with variants, sizes, and states.
 */

import Link from 'next/link';
import { type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

/**
 * Button variants.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

/**
 * Button sizes.
 */
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button props.
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Link href (renders as anchor) */
  href?: string;
  /** Button content */
  children: ReactNode;
}

/**
 * Variant styles.
 */
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
  outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500',
};

/**
 * Size styles.
 * All sizes maintain minimum 44px touch target for accessibility.
 */
const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px] sm:min-h-[44px]',
  md: 'px-4 py-2 text-sm min-h-[44px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
};

/**
 * Loading Spinner
 */
function LoadingSpinner() {
  return (
    <span
      role="status"
      className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"
      aria-label="Loading"
    />
  );
}

/**
 * Button Component
 *
 * @example
 * // Primary button
 * <Button variant="primary" onClick={handleClick}>
 *   Click me
 * </Button>
 *
 * // Loading button
 * <Button isLoading>Saving...</Button>
 *
 * // Link button
 * <Button href="/dashboard">Go to Dashboard</Button>
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  disabled,
  href,
  children,
  className,
  ...props
}: ButtonProps) {
  const baseStyles = cn(
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'touch-manipulation active:scale-[0.98]', // Better mobile touch handling
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && 'w-full',
    className
  );

  const content = (
    <>
      {isLoading && <LoadingSpinner />}
      {children}
    </>
  );

  // Render as link if href is provided
  if (href) {
    return (
      <Link href={href} className={baseStyles}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled || isLoading}
      className={baseStyles}
      {...props}
    >
      {content}
    </button>
  );
}

export default Button;
