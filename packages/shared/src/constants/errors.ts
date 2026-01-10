/**
 * Error Codes and Messages
 *
 * Standardized error codes used across the application.
 * These codes are used in API responses for consistent error handling.
 */

/**
 * All error codes used in the application.
 */
export const ERROR_CODES = {
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SESSION_INVALID: 'SESSION_INVALID',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Not found errors (404)
  NOT_FOUND: 'NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  ARTICLE_NOT_FOUND: 'ARTICLE_NOT_FOUND',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',

  // Conflict errors (409)
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Rate limiting (429)
  RATE_LIMITED: 'RATE_LIMITED',

  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
} as const;

/**
 * Type for error codes.
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * Default error messages for each error code.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation failed',
  [ERROR_CODES.UNAUTHORIZED]: 'Authentication required',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.SESSION_INVALID]: 'Invalid session. Please log in again.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to access this resource',
  [ERROR_CODES.QUOTA_EXCEEDED]: 'You have reached your content limit. Please upgrade your membership.',
  [ERROR_CODES.NOT_FOUND]: 'The requested resource was not found',
  [ERROR_CODES.USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.ARTICLE_NOT_FOUND]: 'Article not found',
  [ERROR_CODES.VIDEO_NOT_FOUND]: 'Video not found',
  [ERROR_CODES.EMAIL_EXISTS]: 'An account with this email already exists',
  [ERROR_CODES.DUPLICATE_ENTRY]: 'This entry already exists',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
  [ERROR_CODES.DATABASE_ERROR]: 'A database error occurred. Please try again.',
} as const;

/**
 * HTTP status codes for each error code.
 */
export const ERROR_STATUS_CODES: Record<ErrorCode, number> = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.INVALID_CREDENTIALS]: 401,
  [ERROR_CODES.SESSION_EXPIRED]: 401,
  [ERROR_CODES.SESSION_INVALID]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.QUOTA_EXCEEDED]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.USER_NOT_FOUND]: 404,
  [ERROR_CODES.ARTICLE_NOT_FOUND]: 404,
  [ERROR_CODES.VIDEO_NOT_FOUND]: 404,
  [ERROR_CODES.EMAIL_EXISTS]: 409,
  [ERROR_CODES.DUPLICATE_ENTRY]: 409,
  [ERROR_CODES.RATE_LIMITED]: 429,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
  [ERROR_CODES.DATABASE_ERROR]: 500,
} as const;

/**
 * Get the default message for an error code.
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.INTERNAL_ERROR];
}

/**
 * Get the HTTP status code for an error code.
 */
export function getErrorStatusCode(code: ErrorCode): number {
  return ERROR_STATUS_CODES[code] || 500;
}
