/**
 * Loading Components
 *
 * Spinner and loading overlay components.
 */

import { type HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

/**
 * Spinner sizes.
 */
export type SpinnerSize = 'sm' | 'md' | 'lg';

/**
 * Spinner props.
 */
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /** Spinner size */
  size?: SpinnerSize;
}

/**
 * Size styles.
 */
const sizeStyles: Record<SpinnerSize, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

/**
 * Spinner Component
 *
 * @example
 * <Spinner size="lg" />
 */
export function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full border-blue-600 border-t-transparent animate-spin',
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}

/**
 * Loading props.
 */
export interface LoadingProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading text */
  text?: string;
  /** Full screen overlay */
  fullScreen?: boolean;
  /** Spinner size */
  size?: SpinnerSize;
}

/**
 * Loading Component
 *
 * @example
 * // Inline loading
 * <Loading text="Loading data..." />
 *
 * // Full screen loading
 * <Loading fullScreen text="Please wait..." />
 */
export function Loading({
  text = 'Loading...',
  fullScreen = false,
  size = 'lg',
  className,
  ...props
}: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen && 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50',
        !fullScreen && 'py-8',
        className
      )}
      {...props}
    >
      <Spinner size={size} />
      {text && (
        <p className="text-sm text-gray-600">{text}</p>
      )}
    </div>
  );
}

export default Loading;
