/**
 * API Types and Interfaces
 *
 * Defines standard API response formats and error structures.
 */

import { type MembershipType } from './membership';

/**
 * Standard API response wrapper.
 * All API responses follow this format for consistency.
 */
export interface ApiResponse<T = unknown> {
  /** Response data (present on success) */
  data?: T;
  /** Error information (present on failure) */
  error?: ApiError;
}

/**
 * Standard API error structure.
 */
export interface ApiError {
  /** Machine-readable error code */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Field-specific validation errors */
  fields?: Record<string, string>;
  /** Additional error context */
  details?: Record<string, unknown>;
}

/**
 * User's content usage statistics.
 */
export interface UsageStats {
  /** Article usage information */
  articles: {
    /** IDs of articles already accessed */
    accessed: string[];
    /** Total count of articles accessed */
    count: number;
    /** Maximum allowed by membership */
    limit: number;
    /** Remaining articles that can be accessed */
    remaining: number;
  };
  /** Video usage information */
  videos: {
    /** IDs of videos already accessed */
    accessed: string[];
    /** Total count of videos accessed */
    count: number;
    /** Maximum allowed by membership */
    limit: number;
    /** Remaining videos that can be accessed */
    remaining: number;
  };
  /** User's current membership type */
  membershipType: MembershipType;
}

/**
 * Result of checking access to content.
 */
export interface AccessResult {
  /** Whether access is allowed */
  allowed: boolean;
  /** Reason for the access decision */
  reason?: 'within_quota' | 'already_accessed' | 'quota_exceeded';
  /** Current usage count */
  currentUsage?: number;
  /** Membership limit */
  limit?: number;
}

/**
 * Session document stored in Firestore.
 */
export interface SessionDocument {
  /** Session token (also used as document ID) */
  token: string;
  /** User ID this session belongs to */
  userId: string;
  /** When the session expires */
  expiresAt: Date;
  /** When the session was created */
  createdAt: Date;
  /** User agent string from the request */
  userAgent?: string;
  /** IP address of the client */
  ipAddress?: string;
}

/**
 * Usage document stored in Firestore.
 */
export interface UsageDocument {
  /** User ID (also used as document ID) */
  userId: string;
  /** IDs of articles the user has accessed */
  articlesAccessed: string[];
  /** IDs of videos the user has accessed */
  videosAccessed: string[];
  /** When usage was last updated */
  lastUpdated: Date;
}

/**
 * Pagination parameters for list endpoints.
 */
export interface PaginationParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Total number of items */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of pages */
  totalPages: number;
}
