/**
 * Membership Types and Interfaces
 *
 * Defines the membership tiers and their associated limits for content access.
 * These types are used across both frontend and backend for type safety.
 */

/**
 * Membership tier types available in the system.
 * - A: Basic tier with limited access (3 articles, 3 videos)
 * - B: Standard tier with moderate access (10 articles, 10 videos)
 * - C: Premium tier with unlimited access
 */
export type MembershipType = 'A' | 'B' | 'C';

/**
 * Defines the content access limits for a membership tier.
 */
export interface MembershipLimits {
  /** Maximum number of articles accessible */
  articles: number;
  /** Maximum number of videos accessible */
  videos: number;
}

/**
 * Authentication providers supported by the system.
 */
export type AuthProvider = 'google' | 'facebook' | 'email';
