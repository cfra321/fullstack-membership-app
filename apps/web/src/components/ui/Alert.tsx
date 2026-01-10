/**
 * Alert Component
 *
 * Displays feedback messages with different variants.
 */

import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

/**
 * Alert variants.
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Alert props.
 */
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Alert variant */
  variant?: AlertVariant;
  /** Alert title */
  title?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Dismissible alert */
  dismissible?: boolean;
  /** Dismiss callback */
  onDismiss?: () => void;
  /** Alert content */
  children: ReactNode;
}

/**
 * Variant styles.
 */
const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

/**
 * Alert icons.
 */
const AlertIcons: Record<AlertVariant, React.FC<{ className?: string }>> = {
  info: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  ),
  success: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  warning: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  error: ({ className }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
  ),
};

/**
 * Alert Component
 *
 * @example
 * // Error alert
 * <Alert variant="error" title="Error">
 *   Something went wrong.
 * </Alert>
 *
 * // Dismissible success alert
 * <Alert variant="success" dismissible onDismiss={handleDismiss}>
 *   Changes saved successfully!
 * </Alert>
 */
export function Alert({
  variant = 'info',
  title,
  showIcon = true,
  dismissible = false,
  onDismiss,
  children,
  className,
  ...props
}: AlertProps) {
  const styles = variantStyles[variant];
  const Icon = AlertIcons[variant];

  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border p-4',
        styles.bg,
        styles.border,
        className
      )}
      {...props}
    >
      <div className="flex">
        {/* Icon */}
        {showIcon && (
          <div className="flex-shrink-0">
            <Icon className={cn('w-5 h-5', styles.icon)} />
          </div>
        )}

        {/* Content */}
        <div className={cn('flex-1', showIcon && 'ml-3')}>
          {title && (
            <h3 className={cn('text-sm font-medium', styles.text)}>
              {title}
            </h3>
          )}
          <div className={cn('text-sm', styles.text, title && 'mt-1')}>
            {children}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={onDismiss}
              className={cn(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                styles.text,
                'hover:bg-black/5 focus:ring-current'
              )}
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Alert;
