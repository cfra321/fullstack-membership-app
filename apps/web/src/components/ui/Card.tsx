/**
 * Card Component
 *
 * Reusable card container with header, content, and footer sections.
 */

import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

/**
 * Card variants.
 */
export type CardVariant = 'default' | 'elevated' | 'flat';

/**
 * Card padding options.
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

/**
 * Card props.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Card variant */
  variant?: CardVariant;
  /** Card padding */
  padding?: CardPadding;
  /** Card content */
  children: ReactNode;
}

/**
 * Variant styles.
 */
const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white rounded-xl shadow-sm border border-gray-200',
  elevated: 'bg-white rounded-xl shadow-lg',
  flat: 'bg-white rounded-xl border border-gray-200',
};

/**
 * Padding styles.
 */
const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Card Component
 *
 * @example
 * <Card>
 *   <CardHeader title="Card Title" />
 *   <CardContent>Card content here</CardContent>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 */
export function Card({
  variant = 'default',
  padding = 'md',
  children,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Card Header props.
 */
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Header title */
  title: string;
  /** Header subtitle */
  subtitle?: string;
  /** Action element */
  action?: ReactNode;
}

/**
 * Card Header Component
 */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
  ...props
}: CardHeaderProps) {
  return (
    <div
      className={cn('flex items-start justify-between mb-4', className)}
      {...props}
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/**
 * Card Content props.
 */
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card Content Component
 */
export function CardContent({
  children,
  className,
  ...props
}: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Card Footer props.
 */
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Card Footer Component
 */
export function CardFooter({
  children,
  className,
  ...props
}: CardFooterProps) {
  return (
    <div
      className={cn('border-t border-gray-100 pt-4 mt-4', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
