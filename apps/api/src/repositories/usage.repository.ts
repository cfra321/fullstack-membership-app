/**
 * Usage Repository
 *
 * Handles tracking of content access for quota enforcement.
 * Uses userId as document ID for fast lookups.
 * Stores arrays of accessed content IDs per user.
 */

import { FieldValue } from 'firebase-admin/firestore';

import { getDb, COLLECTIONS } from '../config/firebase';

/**
 * Usage document as stored in Firestore.
 */
export interface UsageDocument {
  /** User ID (also used as document ID) */
  userId: string;
  /** Array of accessed article IDs */
  articlesAccessed: string[];
  /** Array of accessed video IDs */
  videosAccessed: string[];
  /** When the usage was last updated */
  lastUpdated: Date;
}

/**
 * Convert Firestore document data to UsageDocument.
 */
function toUsageDocument(
  id: string,
  data: FirebaseFirestore.DocumentData
): UsageDocument {
  return {
    userId: id,
    articlesAccessed: data.articlesAccessed ?? [],
    videosAccessed: data.videosAccessed ?? [],
    lastUpdated: data.lastUpdated?.toDate?.() ?? data.lastUpdated ?? new Date(),
  };
}

/**
 * Create an empty usage document for a new user.
 */
function createEmptyUsage(userId: string): UsageDocument {
  return {
    userId,
    articlesAccessed: [],
    videosAccessed: [],
    lastUpdated: new Date(),
  };
}

/**
 * Get usage data for a user.
 * Returns empty arrays if user has no usage record.
 *
 * @param userId - The user ID to get usage for
 * @returns The usage document
 *
 * @example
 * const usage = await getUsage(user.id);
 * console.log(`Articles accessed: ${usage.articlesAccessed.length}`);
 */
export async function getUsage(userId: string): Promise<UsageDocument> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USAGE).doc(userId);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    return createEmptyUsage(userId);
  }

  return toUsageDocument(docSnapshot.id, docSnapshot.data()!);
}

/**
 * Record that a user has accessed an article.
 * Uses Firestore arrayUnion to prevent duplicates.
 *
 * @param userId - The user ID
 * @param articleId - The article ID being accessed
 *
 * @example
 * await recordArticleAccess(user.id, article.id);
 */
export async function recordArticleAccess(
  userId: string,
  articleId: string
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USAGE).doc(userId);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    // Create new usage document for first access
    await docRef.set({
      userId,
      articlesAccessed: [articleId],
      videosAccessed: [],
      lastUpdated: new Date(),
    });
  } else {
    // Update existing document using arrayUnion to prevent duplicates
    await docRef.update({
      articlesAccessed: FieldValue.arrayUnion(articleId),
      lastUpdated: new Date(),
    });
  }
}

/**
 * Record that a user has accessed a video.
 * Uses Firestore arrayUnion to prevent duplicates.
 *
 * @param userId - The user ID
 * @param videoId - The video ID being accessed
 *
 * @example
 * await recordVideoAccess(user.id, video.id);
 */
export async function recordVideoAccess(
  userId: string,
  videoId: string
): Promise<void> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USAGE).doc(userId);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    // Create new usage document for first access
    await docRef.set({
      userId,
      articlesAccessed: [],
      videosAccessed: [videoId],
      lastUpdated: new Date(),
    });
  } else {
    // Update existing document using arrayUnion to prevent duplicates
    await docRef.update({
      videosAccessed: FieldValue.arrayUnion(videoId),
      lastUpdated: new Date(),
    });
  }
}

/**
 * Check if a user has already accessed an article.
 * Used to determine if accessing counts against quota.
 *
 * @param userId - The user ID
 * @param articleId - The article ID to check
 * @returns true if the user has already accessed the article
 *
 * @example
 * const alreadyAccessed = await hasAccessedArticle(user.id, article.id);
 * if (!alreadyAccessed && usage.articlesAccessed.length >= limit) {
 *   throw new QuotaExceededError(...);
 * }
 */
export async function hasAccessedArticle(
  userId: string,
  articleId: string
): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage.articlesAccessed.includes(articleId);
}

/**
 * Check if a user has already accessed a video.
 * Used to determine if accessing counts against quota.
 *
 * @param userId - The user ID
 * @param videoId - The video ID to check
 * @returns true if the user has already accessed the video
 *
 * @example
 * const alreadyAccessed = await hasAccessedVideo(user.id, video.id);
 * if (!alreadyAccessed && usage.videosAccessed.length >= limit) {
 *   throw new QuotaExceededError(...);
 * }
 */
export async function hasAccessedVideo(
  userId: string,
  videoId: string
): Promise<boolean> {
  const usage = await getUsage(userId);
  return usage.videosAccessed.includes(videoId);
}

/**
 * Get usage counts for a user.
 * Convenience function for checking quota status.
 *
 * @param userId - The user ID
 * @returns Object with article and video counts
 *
 * @example
 * const counts = await getUsageCounts(user.id);
 * console.log(`Articles: ${counts.articles}, Videos: ${counts.videos}`);
 */
export async function getUsageCounts(
  userId: string
): Promise<{ articles: number; videos: number }> {
  const usage = await getUsage(userId);
  return {
    articles: usage.articlesAccessed.length,
    videos: usage.videosAccessed.length,
  };
}

/**
 * Reset usage for a user.
 * Only used for testing or administrative purposes.
 *
 * @param userId - The user ID to reset
 */
export async function resetUsage(userId: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USAGE).doc(userId);

  await docRef.set({
    userId,
    articlesAccessed: [],
    videosAccessed: [],
    lastUpdated: new Date(),
  });
}
