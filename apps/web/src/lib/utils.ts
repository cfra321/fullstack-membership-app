/**
 * Utility Functions
 *
 * Common helper functions for the frontend application.
 */

/**
 * Combine class names, filtering out falsy values.
 *
 * @param classes - Class names to combine
 * @returns Combined class string
 *
 * @example
 * cn('btn', isActive && 'btn-active', 'mt-4')
 * // => 'btn btn-active mt-4' (if isActive is true)
 */
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Format a date for display.
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(d);
}

/**
 * Format a duration in seconds to a human-readable string.
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration (e.g., "5:30" or "1:05:30")
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to a maximum length with ellipsis.
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep for a given duration.
 * Useful for testing loading states.
 *
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get initials from a display name.
 *
 * @param name - Display name
 * @returns Initials (1-2 characters)
 *
 * @example
 * getInitials('John Doe') // => 'JD'
 * getInitials('Alice') // => 'A'
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0]?.charAt(0).toUpperCase() || '';
  }
  return (
    (parts[0]?.charAt(0) || '') + (parts[parts.length - 1]?.charAt(0) || '')
  ).toUpperCase();
}

/**
 * Format usage statistics for display.
 *
 * @param count - Number of items used
 * @param limit - Maximum allowed
 * @returns Formatted string (e.g., "3/10" or "3/Unlimited")
 */
export function formatUsage(count: number, limit: number): string {
  if (limit === Infinity || limit === Number.MAX_SAFE_INTEGER) {
    return `${count}/Unlimited`;
  }
  return `${count}/${limit}`;
}

/**
 * Calculate remaining quota percentage.
 *
 * @param count - Number of items used
 * @param limit - Maximum allowed
 * @returns Percentage remaining (0-100)
 */
export function getRemainingPercentage(count: number, limit: number): number {
  if (limit === Infinity || limit === Number.MAX_SAFE_INTEGER) {
    return 100;
  }
  if (limit === 0) {
    return 0;
  }
  const remaining = Math.max(0, limit - count);
  return Math.round((remaining / limit) * 100);
}

/**
 * Check if a value is a valid email format.
 *
 * @param email - Email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Get membership type display name.
 *
 * @param type - Membership type (A, B, C)
 * @returns Display name
 */
export function getMembershipDisplayName(type: 'A' | 'B' | 'C'): string {
  const names: Record<'A' | 'B' | 'C', string> = {
    A: 'Basic',
    B: 'Standard',
    C: 'Premium',
  };
  return names[type];
}
