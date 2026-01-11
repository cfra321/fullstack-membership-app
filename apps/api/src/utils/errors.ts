/**
 * Custom Error Classes
 *
 * Provides a hierarchy of error classes for consistent error handling
 * across the application. All errors extend AppError which provides
 * a standard structure for API error responses.
 */

import {
  ERROR_CODES,
  ERROR_MESSAGES,
  type ErrorCode,
} from '@astronacci/shared';

/**
 * Base application error class.
 * All custom errors should extend this class.
 */
export class AppError extends Error {
  /** HTTP status code */
  public readonly statusCode: number;
  /** Machine-readable error code */
  public readonly code: string;
  /** Additional error details */
  public readonly details?: Record<string, unknown>;
  /** Whether this error is operational (expected) vs programming error */
  public readonly isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;

    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format for API responses.
   */
  toJSON(): {
    error: {
      code: string;
      message: string;
      details?: Record<string, unknown>;
    };
  } {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Validation error for invalid input data.
 * Returns HTTP 400 Bad Request.
 */
export class ValidationError extends AppError {
  /** Field-specific validation errors */
  public readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>, message?: string) {
    super(
      ERROR_CODES.VALIDATION_ERROR,
      message || ERROR_MESSAGES.VALIDATION_ERROR,
      400,
      { fields }
    );
    this.fields = fields;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        fields: this.fields,
      },
    };
  }
}

/**
 * Unauthorized error for authentication failures.
 * Returns HTTP 401 Unauthorized.
 */
export class UnauthorizedError extends AppError {
  constructor(
    code: ErrorCode = ERROR_CODES.UNAUTHORIZED,
    message?: string
  ) {
    super(
      code,
      message || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNAUTHORIZED,
      401
    );
  }
}

/**
 * Invalid credentials error for login failures.
 * Returns HTTP 401 Unauthorized.
 */
export class InvalidCredentialsError extends UnauthorizedError {
  constructor(message?: string) {
    super(
      ERROR_CODES.INVALID_CREDENTIALS,
      message || ERROR_MESSAGES.INVALID_CREDENTIALS
    );
  }
}

/**
 * Session expired error.
 * Returns HTTP 401 Unauthorized.
 */
export class SessionExpiredError extends UnauthorizedError {
  constructor(message?: string) {
    super(
      ERROR_CODES.SESSION_EXPIRED,
      message || ERROR_MESSAGES.SESSION_EXPIRED
    );
  }
}

/**
 * Session invalid error.
 * Returns HTTP 401 Unauthorized.
 */
export class SessionInvalidError extends UnauthorizedError {
  constructor(message?: string) {
    super(
      ERROR_CODES.SESSION_INVALID,
      message || ERROR_MESSAGES.SESSION_INVALID
    );
  }
}

/**
 * Forbidden error for authorization failures.
 * Returns HTTP 403 Forbidden.
 */
export class ForbiddenError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.FORBIDDEN,
      message || ERROR_MESSAGES.FORBIDDEN,
      403
    );
  }
}

/**
 * Quota exceeded error for membership limit violations.
 * Returns HTTP 403 Forbidden.
 */
export class QuotaExceededError extends AppError {
  constructor(
    currentUsage: number,
    limit: number,
    membershipType: string,
    message?: string
  ) {
    super(
      ERROR_CODES.QUOTA_EXCEEDED,
      message || ERROR_MESSAGES.QUOTA_EXCEEDED,
      403,
      {
        currentUsage,
        limit,
        membershipType,
      }
    );
  }
}

/**
 * Not found error for missing resources.
 * Returns HTTP 404 Not Found.
 */
export class NotFoundError extends AppError {
  constructor(
    resource?: string,
    code: ErrorCode = ERROR_CODES.NOT_FOUND,
    message?: string
  ) {
    super(
      code,
      message || (resource ? `${resource} not found` : ERROR_MESSAGES.NOT_FOUND),
      404,
      resource ? { resource } : undefined
    );
  }
}

/**
 * User not found error.
 * Returns HTTP 404 Not Found.
 */
export class UserNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super('User', ERROR_CODES.USER_NOT_FOUND, message || ERROR_MESSAGES.USER_NOT_FOUND);
  }
}

/**
 * Article not found error.
 * Returns HTTP 404 Not Found.
 */
export class ArticleNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super('Article', ERROR_CODES.ARTICLE_NOT_FOUND, message || ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  }
}

/**
 * Video not found error.
 * Returns HTTP 404 Not Found.
 */
export class VideoNotFoundError extends NotFoundError {
  constructor(message?: string) {
    super('Video', ERROR_CODES.VIDEO_NOT_FOUND, message || ERROR_MESSAGES.VIDEO_NOT_FOUND);
  }
}

/**
 * Conflict error for duplicate entries.
 * Returns HTTP 409 Conflict.
 */
export class ConflictError extends AppError {
  constructor(
    code: ErrorCode = ERROR_CODES.DUPLICATE_ENTRY,
    message?: string
  ) {
    super(
      code,
      message || ERROR_MESSAGES[code] || ERROR_MESSAGES.DUPLICATE_ENTRY,
      409
    );
  }
}

/**
 * Email already exists error.
 * Returns HTTP 409 Conflict.
 */
export class EmailExistsError extends ConflictError {
  constructor(message?: string) {
    super(ERROR_CODES.EMAIL_EXISTS, message || ERROR_MESSAGES.EMAIL_EXISTS);
  }
}

/**
 * Rate limited error for too many requests.
 * Returns HTTP 429 Too Many Requests.
 */
export class RateLimitedError extends AppError {
  constructor(message?: string) {
    super(
      ERROR_CODES.RATE_LIMITED,
      message || ERROR_MESSAGES.RATE_LIMITED,
      429
    );
  }
}

/**
 * Internal server error for unexpected failures.
 * Returns HTTP 500 Internal Server Error.
 */
export class InternalError extends AppError {
  constructor(message?: string, originalError?: Error) {
    super(
      ERROR_CODES.INTERNAL_ERROR,
      message || ERROR_MESSAGES.INTERNAL_ERROR,
      500,
      originalError ? { originalMessage: originalError.message } : undefined
    );
    // Mark as non-operational since this is unexpected
    (this as { isOperational: boolean }).isOperational = false;
  }
}

/**
 * Database error for Firestore failures.
 * Returns HTTP 500 Internal Server Error.
 */
export class DatabaseError extends AppError {
  constructor(message?: string, originalError?: Error) {
    super(
      ERROR_CODES.DATABASE_ERROR,
      message || ERROR_MESSAGES.DATABASE_ERROR,
      500,
      originalError ? { originalMessage: originalError.message } : undefined
    );
  }
}

/**
 * Check if an error is an operational AppError.
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Check if an error is operational (expected, not a programming bug).
 */
export function isOperationalError(error: unknown): boolean {
  if (isAppError(error)) {
    return error.isOperational;
  }
  return false;
}
