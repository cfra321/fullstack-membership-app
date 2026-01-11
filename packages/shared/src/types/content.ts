/**
 * Content Types and Interfaces
 *
 * Defines types for articles and videos in the membership system.
 */

/**
 * Preview information for an article (shown in lists).
 * Does not include the full protected content.
 */
export interface ArticlePreview {
  /** Unique article identifier */
  id: string;
  /** Article title */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Short description/excerpt */
  preview: string;
  /** Cover image URL */
  coverImage?: string;
  /** Article author */
  author: string;
  /** When the article was published */
  publishedAt: Date;
}

/**
 * Full article data including protected content.
 * Only returned when user has access (within quota).
 */
export interface Article extends ArticlePreview {
  /** Full article content (protected) */
  content: string;
  /** When the article was created */
  createdAt: Date;
  /** When the article was last updated */
  updatedAt: Date;
}

/**
 * Complete article document as stored in Firestore.
 */
export interface ArticleDocument extends Article {
  // All fields are the same as Article
}

/**
 * Preview information for a video (shown in lists).
 * Does not include the protected video URL.
 */
export interface VideoPreview {
  /** Unique video identifier */
  id: string;
  /** Video title */
  title: string;
  /** URL-friendly slug */
  slug: string;
  /** Short description */
  description: string;
  /** Thumbnail image URL */
  thumbnail: string;
  /** Video duration in seconds */
  duration: number;
  /** Video author/creator */
  author: string;
  /** When the video was published */
  publishedAt: Date;
}

/**
 * Full video data including protected video URL.
 * Only returned when user has access (within quota).
 */
export interface Video extends VideoPreview {
  /** Protected video URL */
  videoUrl: string;
  /** When the video was created */
  createdAt: Date;
  /** When the video was last updated */
  updatedAt: Date;
}

/**
 * Complete video document as stored in Firestore.
 */
export interface VideoDocument extends Video {
  // All fields are the same as Video
}

/**
 * Content type identifier.
 */
export type ContentType = 'article' | 'video';
