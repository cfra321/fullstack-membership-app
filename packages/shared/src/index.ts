/**
 * @astronacci/shared
 *
 * Shared types, constants, and utilities for the Astronacci membership application.
 * This package is used by both the frontend (apps/web) and backend (apps/api).
 */

// Package identifier
export const PACKAGE_NAME = '@astronacci/shared';

// ============================================================================
// Types
// ============================================================================

// Membership types
export type {
  MembershipType,
  MembershipLimits,
  AuthProvider,
} from './types/membership';

// User types
export type {
  User,
  UserDocument,
  RegisterInput,
  LoginInput,
  AuthResult,
} from './types/user';

// Content types
export type {
  ArticlePreview,
  Article,
  ArticleDocument,
  VideoPreview,
  Video,
  VideoDocument,
  ContentType,
} from './types/content';

// API types
export type {
  ApiResponse,
  ApiError,
  UsageStats,
  AccessResult,
  SessionDocument,
  UsageDocument,
  PaginationParams,
  PaginatedResponse,
} from './types/api';

// ============================================================================
// Constants
// ============================================================================

// Membership constants
export {
  MEMBERSHIP_LIMITS,
  DEFAULT_MEMBERSHIP_TYPE,
  MEMBERSHIP_TYPES,
  MEMBERSHIP_NAMES,
  hasUnlimitedAccess,
  getLimit,
} from './constants/membership';

// Error constants
export {
  ERROR_CODES,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  getErrorMessage,
  getErrorStatusCode,
} from './constants/errors';

export type { ErrorCode } from './constants/errors';
