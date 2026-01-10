/**
 * User Service
 *
 * Provides user profile and usage data for API responses.
 * Formats user data without exposing sensitive fields.
 */

import { type User, type UsageStats } from '@astronacci/shared';

import { findById } from '../repositories/user.repository';
import { getUsageStats } from './quota.service';
import { UserNotFoundError } from '../utils/errors';

/**
 * Get a user's public profile.
 *
 * Returns user data without sensitive fields like password hash,
 * OAuth IDs, or internal timestamps.
 *
 * @param userId - The user's ID
 * @returns The user's public profile
 * @throws UserNotFoundError if user doesn't exist
 *
 * @example
 * const profile = await getProfile(userId);
 * res.json({ data: profile });
 */
export async function getProfile(userId: string): Promise<User> {
  const user = await findById(userId);

  if (!user) {
    throw new UserNotFoundError();
  }

  // Return only public user fields
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    membershipType: user.membershipType,
    authProvider: user.authProvider,
  };
}

/**
 * Get a user's usage statistics.
 *
 * Returns formatted usage data showing content access counts,
 * limits based on membership, and remaining quota.
 *
 * @param userId - The user's ID
 * @returns The user's usage statistics
 *
 * @example
 * const usage = await getUsage(userId);
 * console.log(`Articles: ${usage.articles.count}/${usage.articles.limit}`);
 * console.log(`Videos: ${usage.videos.count}/${usage.videos.limit}`);
 */
export async function getUsage(userId: string): Promise<UsageStats> {
  return getUsageStats(userId);
}

/**
 * Get a user's profile with usage statistics.
 *
 * Convenience function that fetches both profile and usage
 * data in parallel.
 *
 * @param userId - The user's ID
 * @returns Object containing profile and usage data
 * @throws UserNotFoundError if user doesn't exist
 *
 * @example
 * const { profile, usage } = await getProfileWithUsage(userId);
 */
export async function getProfileWithUsage(
  userId: string
): Promise<{ profile: User; usage: UsageStats }> {
  const [profile, usage] = await Promise.all([
    getProfile(userId),
    getUsage(userId),
  ]);

  return { profile, usage };
}
