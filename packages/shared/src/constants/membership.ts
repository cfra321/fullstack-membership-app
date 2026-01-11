/**
 * Membership Constants
 *
 * Defines the content access limits for each membership tier.
 */

import { type MembershipLimits, type MembershipType } from '../types/membership';

/**
 * Content access limits for each membership type.
 *
 * Type A: Basic tier - 3 articles, 3 videos
 * Type B: Standard tier - 10 articles, 10 videos
 * Type C: Premium tier - Unlimited access
 */
export const MEMBERSHIP_LIMITS: Record<MembershipType, MembershipLimits> = {
  A: { articles: 3, videos: 3 },
  B: { articles: 10, videos: 10 },
  C: { articles: Infinity, videos: Infinity },
} as const;

/**
 * Default membership type assigned to new users.
 */
export const DEFAULT_MEMBERSHIP_TYPE: MembershipType = 'A';

/**
 * All available membership types.
 */
export const MEMBERSHIP_TYPES: readonly MembershipType[] = ['A', 'B', 'C'] as const;

/**
 * Human-readable names for membership types.
 */
export const MEMBERSHIP_NAMES: Record<MembershipType, string> = {
  A: 'Basic',
  B: 'Standard',
  C: 'Premium',
} as const;

/**
 * Check if a membership type has unlimited access for a content type.
 */
export function hasUnlimitedAccess(
  membershipType: MembershipType,
  contentType: 'articles' | 'videos'
): boolean {
  return MEMBERSHIP_LIMITS[membershipType][contentType] === Infinity;
}

/**
 * Get the limit for a specific membership type and content type.
 */
export function getLimit(
  membershipType: MembershipType,
  contentType: 'articles' | 'videos'
): number {
  return MEMBERSHIP_LIMITS[membershipType][contentType];
}
