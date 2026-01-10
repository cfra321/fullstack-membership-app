/**
 * Content Repository
 *
 * Handles retrieval of articles and videos from Firestore.
 * Provides methods for both preview (list) and full content access.
 */

import {
  type Article,
  type ArticlePreview,
  type Video,
  type VideoPreview,
} from '@astronacci/shared';

import { getDb, COLLECTIONS } from '../config/firebase';

/**
 * Default limit for list queries.
 */
const DEFAULT_LIST_LIMIT = 50;

/**
 * Convert Firestore document data to ArticlePreview.
 * Excludes protected content field.
 */
function toArticlePreview(
  id: string,
  data: FirebaseFirestore.DocumentData
): ArticlePreview {
  return {
    id,
    title: data.title,
    slug: data.slug,
    preview: data.preview,
    coverImage: data.coverImage,
    author: data.author,
    publishedAt: data.publishedAt?.toDate?.() ?? data.publishedAt,
  };
}

/**
 * Convert Firestore document data to full Article.
 * Includes protected content field.
 */
function toArticle(
  id: string,
  data: FirebaseFirestore.DocumentData
): Article {
  return {
    id,
    title: data.title,
    slug: data.slug,
    preview: data.preview,
    content: data.content,
    coverImage: data.coverImage,
    author: data.author,
    publishedAt: data.publishedAt?.toDate?.() ?? data.publishedAt,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
  };
}

/**
 * Convert Firestore document data to VideoPreview.
 * Excludes protected videoUrl field.
 */
function toVideoPreview(
  id: string,
  data: FirebaseFirestore.DocumentData
): VideoPreview {
  return {
    id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    thumbnail: data.thumbnail,
    duration: data.duration,
    author: data.author,
    publishedAt: data.publishedAt?.toDate?.() ?? data.publishedAt,
  };
}

/**
 * Convert Firestore document data to full Video.
 * Includes protected videoUrl field.
 */
function toVideo(
  id: string,
  data: FirebaseFirestore.DocumentData
): Video {
  return {
    id,
    title: data.title,
    slug: data.slug,
    description: data.description,
    thumbnail: data.thumbnail,
    videoUrl: data.videoUrl,
    duration: data.duration,
    author: data.author,
    publishedAt: data.publishedAt?.toDate?.() ?? data.publishedAt,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
  };
}

/**
 * List articles with preview data only.
 * Returns articles ordered by publish date (newest first).
 * Does NOT include protected content field.
 *
 * @param limit - Maximum number of articles to return
 * @returns Array of article previews
 *
 * @example
 * const articles = await listArticles();
 * // Returns: [{ id, title, slug, preview, author, publishedAt }]
 */
export async function listArticles(limit: number = DEFAULT_LIST_LIMIT): Promise<ArticlePreview[]> {
  const db = getDb();
  const articlesCollection = db.collection(COLLECTIONS.ARTICLES);

  const querySnapshot = await articlesCollection
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map((doc) => toArticlePreview(doc.id, doc.data()));
}

/**
 * Get a full article by its ID.
 * Includes protected content field.
 * Should only be called after quota check passes.
 *
 * @param id - The article document ID
 * @returns The full article or null if not found
 *
 * @example
 * const article = await getArticleById('article-123');
 * if (article) {
 *   console.log(article.content); // Protected content
 * }
 */
export async function getArticleById(id: string): Promise<Article | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.ARTICLES).doc(id);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    return null;
  }

  return toArticle(docSnapshot.id, docSnapshot.data()!);
}

/**
 * Get an article by its slug.
 * Includes protected content field.
 * Should only be called after quota check passes.
 *
 * @param slug - The article's URL-friendly slug
 * @returns The full article or null if not found
 */
export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const db = getDb();
  const articlesCollection = db.collection(COLLECTIONS.ARTICLES);

  const querySnapshot = await articlesCollection
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0]!;
  return toArticle(doc.id, doc.data());
}

/**
 * List videos with preview data only.
 * Returns videos ordered by publish date (newest first).
 * Does NOT include protected videoUrl field.
 *
 * @param limit - Maximum number of videos to return
 * @returns Array of video previews
 *
 * @example
 * const videos = await listVideos();
 * // Returns: [{ id, title, slug, description, thumbnail, duration, author, publishedAt }]
 */
export async function listVideos(limit: number = DEFAULT_LIST_LIMIT): Promise<VideoPreview[]> {
  const db = getDb();
  const videosCollection = db.collection(COLLECTIONS.VIDEOS);

  const querySnapshot = await videosCollection
    .orderBy('publishedAt', 'desc')
    .limit(limit)
    .get();

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map((doc) => toVideoPreview(doc.id, doc.data()));
}

/**
 * Get a full video by its ID.
 * Includes protected videoUrl field.
 * Should only be called after quota check passes.
 *
 * @param id - The video document ID
 * @returns The full video or null if not found
 *
 * @example
 * const video = await getVideoById('video-123');
 * if (video) {
 *   console.log(video.videoUrl); // Protected URL
 * }
 */
export async function getVideoById(id: string): Promise<Video | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.VIDEOS).doc(id);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    return null;
  }

  return toVideo(docSnapshot.id, docSnapshot.data()!);
}

/**
 * Get a video by its slug.
 * Includes protected videoUrl field.
 * Should only be called after quota check passes.
 *
 * @param slug - The video's URL-friendly slug
 * @returns The full video or null if not found
 */
export async function getVideoBySlug(slug: string): Promise<Video | null> {
  const db = getDb();
  const videosCollection = db.collection(COLLECTIONS.VIDEOS);

  const querySnapshot = await videosCollection
    .where('slug', '==', slug)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0]!;
  return toVideo(doc.id, doc.data());
}
