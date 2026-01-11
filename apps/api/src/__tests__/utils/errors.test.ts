/**
 * Error Classes Tests
 *
 * Tests for custom error classes and error handler middleware.
 */

import {
  AppError,
  ValidationError,
  UnauthorizedError,
  InvalidCredentialsError,
  SessionExpiredError,
  SessionInvalidError,
  ForbiddenError,
  QuotaExceededError,
  NotFoundError,
  UserNotFoundError,
  ArticleNotFoundError,
  VideoNotFoundError,
  ConflictError,
  EmailExistsError,
  RateLimitedError,
  InternalError,
  DatabaseError,
  isAppError,
  isOperationalError,
} from '../../utils/errors';

import { ERROR_CODES, ERROR_MESSAGES } from '@astronacci/shared';

describe('AppError', () => {
  it('should create error with correct properties', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('TEST_ERROR');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
    expect(error.name).toBe('AppError');
  });

  it('should create error with details', () => {
    const details = { field: 'value', count: 42 };
    const error = new AppError('TEST_ERROR', 'Test message', 400, details);

    expect(error.details).toEqual(details);
  });

  it('should serialize to JSON correctly', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400);
    const json = error.toJSON();

    expect(json).toEqual({
      error: {
        code: 'TEST_ERROR',
        message: 'Test message',
      },
    });
  });

  it('should serialize to JSON with details', () => {
    const details = { extra: 'info' };
    const error = new AppError('TEST_ERROR', 'Test message', 400, details);
    const json = error.toJSON();

    expect(json).toEqual({
      error: {
        code: 'TEST_ERROR',
        message: 'Test message',
        details: { extra: 'info' },
      },
    });
  });

  it('should have proper stack trace', () => {
    const error = new AppError('TEST_ERROR', 'Test message', 400);

    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('AppError');
  });
});

describe('ValidationError', () => {
  it('should return 400 status code with fields', () => {
    const fields = { email: 'Invalid email format', password: 'Too short' };
    const error = new ValidationError(fields);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(error.message).toBe(ERROR_MESSAGES.VALIDATION_ERROR);
    expect(error.fields).toEqual(fields);
    expect(error.isOperational).toBe(true);
  });

  it('should accept custom message', () => {
    const fields = { name: 'Required' };
    const error = new ValidationError(fields, 'Custom validation message');

    expect(error.message).toBe('Custom validation message');
  });

  it('should serialize with fields in JSON', () => {
    const fields = { email: 'Invalid email' };
    const error = new ValidationError(fields);
    const json = error.toJSON();

    expect(json).toEqual({
      error: {
        code: ERROR_CODES.VALIDATION_ERROR,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        fields: { email: 'Invalid email' },
      },
    });
  });
});

describe('UnauthorizedError', () => {
  it('should return 401 status code', () => {
    const error = new UnauthorizedError();

    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ERROR_CODES.UNAUTHORIZED);
    expect(error.message).toBe(ERROR_MESSAGES.UNAUTHORIZED);
    expect(error.isOperational).toBe(true);
  });

  it('should accept custom code and message', () => {
    const error = new UnauthorizedError(ERROR_CODES.SESSION_EXPIRED, 'Custom message');

    expect(error.code).toBe(ERROR_CODES.SESSION_EXPIRED);
    expect(error.message).toBe('Custom message');
  });
});

describe('InvalidCredentialsError', () => {
  it('should return 401 with INVALID_CREDENTIALS code', () => {
    const error = new InvalidCredentialsError();

    expect(error).toBeInstanceOf(InvalidCredentialsError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ERROR_CODES.INVALID_CREDENTIALS);
    expect(error.message).toBe(ERROR_MESSAGES.INVALID_CREDENTIALS);
  });
});

describe('SessionExpiredError', () => {
  it('should return 401 with SESSION_EXPIRED code', () => {
    const error = new SessionExpiredError();

    expect(error).toBeInstanceOf(SessionExpiredError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ERROR_CODES.SESSION_EXPIRED);
    expect(error.message).toBe(ERROR_MESSAGES.SESSION_EXPIRED);
  });
});

describe('SessionInvalidError', () => {
  it('should return 401 with SESSION_INVALID code', () => {
    const error = new SessionInvalidError();

    expect(error).toBeInstanceOf(SessionInvalidError);
    expect(error).toBeInstanceOf(UnauthorizedError);
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe(ERROR_CODES.SESSION_INVALID);
    expect(error.message).toBe(ERROR_MESSAGES.SESSION_INVALID);
  });
});

describe('ForbiddenError', () => {
  it('should return 403 status code', () => {
    const error = new ForbiddenError();

    expect(error).toBeInstanceOf(ForbiddenError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ERROR_CODES.FORBIDDEN);
    expect(error.message).toBe(ERROR_MESSAGES.FORBIDDEN);
  });

  it('should accept custom message', () => {
    const error = new ForbiddenError('Access denied to resource');

    expect(error.message).toBe('Access denied to resource');
  });
});

describe('QuotaExceededError', () => {
  it('should return 403 with usage details', () => {
    const error = new QuotaExceededError(3, 3, 'A');

    expect(error).toBeInstanceOf(QuotaExceededError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe(ERROR_CODES.QUOTA_EXCEEDED);
    expect(error.message).toBe(ERROR_MESSAGES.QUOTA_EXCEEDED);
    expect(error.details).toEqual({
      currentUsage: 3,
      limit: 3,
      membershipType: 'A',
    });
  });

  it('should accept custom message', () => {
    const error = new QuotaExceededError(10, 10, 'B', 'Video quota exceeded');

    expect(error.message).toBe('Video quota exceeded');
  });

  it('should serialize with details', () => {
    const error = new QuotaExceededError(5, 10, 'B');
    const json = error.toJSON();

    expect(json.error.details).toEqual({
      currentUsage: 5,
      limit: 10,
      membershipType: 'B',
    });
  });
});

describe('NotFoundError', () => {
  it('should return 404 status code', () => {
    const error = new NotFoundError();

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ERROR_CODES.NOT_FOUND);
    expect(error.message).toBe(ERROR_MESSAGES.NOT_FOUND);
  });

  it('should include resource name in message', () => {
    const error = new NotFoundError('Article');

    expect(error.message).toBe('Article not found');
    expect(error.details).toEqual({ resource: 'Article' });
  });

  it('should accept custom code and message', () => {
    const error = new NotFoundError('User', ERROR_CODES.USER_NOT_FOUND, 'User does not exist');

    expect(error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    expect(error.message).toBe('User does not exist');
  });
});

describe('UserNotFoundError', () => {
  it('should return 404 with USER_NOT_FOUND code', () => {
    const error = new UserNotFoundError();

    expect(error).toBeInstanceOf(UserNotFoundError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ERROR_CODES.USER_NOT_FOUND);
    expect(error.message).toBe(ERROR_MESSAGES.USER_NOT_FOUND);
  });
});

describe('ArticleNotFoundError', () => {
  it('should return 404 with ARTICLE_NOT_FOUND code', () => {
    const error = new ArticleNotFoundError();

    expect(error).toBeInstanceOf(ArticleNotFoundError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ERROR_CODES.ARTICLE_NOT_FOUND);
    expect(error.message).toBe(ERROR_MESSAGES.ARTICLE_NOT_FOUND);
  });
});

describe('VideoNotFoundError', () => {
  it('should return 404 with VIDEO_NOT_FOUND code', () => {
    const error = new VideoNotFoundError();

    expect(error).toBeInstanceOf(VideoNotFoundError);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe(ERROR_CODES.VIDEO_NOT_FOUND);
    expect(error.message).toBe(ERROR_MESSAGES.VIDEO_NOT_FOUND);
  });
});

describe('ConflictError', () => {
  it('should return 409 status code', () => {
    const error = new ConflictError();

    expect(error).toBeInstanceOf(ConflictError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ERROR_CODES.DUPLICATE_ENTRY);
    expect(error.message).toBe(ERROR_MESSAGES.DUPLICATE_ENTRY);
  });

  it('should accept custom code', () => {
    const error = new ConflictError(ERROR_CODES.EMAIL_EXISTS);

    expect(error.code).toBe(ERROR_CODES.EMAIL_EXISTS);
    expect(error.message).toBe(ERROR_MESSAGES.EMAIL_EXISTS);
  });
});

describe('EmailExistsError', () => {
  it('should return 409 with EMAIL_EXISTS code', () => {
    const error = new EmailExistsError();

    expect(error).toBeInstanceOf(EmailExistsError);
    expect(error).toBeInstanceOf(ConflictError);
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe(ERROR_CODES.EMAIL_EXISTS);
    expect(error.message).toBe(ERROR_MESSAGES.EMAIL_EXISTS);
  });
});

describe('RateLimitedError', () => {
  it('should return 429 status code', () => {
    const error = new RateLimitedError();

    expect(error).toBeInstanceOf(RateLimitedError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe(ERROR_CODES.RATE_LIMITED);
    expect(error.message).toBe(ERROR_MESSAGES.RATE_LIMITED);
  });
});

describe('InternalError', () => {
  it('should return 500 status code', () => {
    const error = new InternalError();

    expect(error).toBeInstanceOf(InternalError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ERROR_CODES.INTERNAL_ERROR);
    expect(error.message).toBe(ERROR_MESSAGES.INTERNAL_ERROR);
  });

  it('should be marked as non-operational', () => {
    const error = new InternalError();

    expect(error.isOperational).toBe(false);
  });

  it('should capture original error message', () => {
    const originalError = new Error('Database connection failed');
    const error = new InternalError('Something went wrong', originalError);

    expect(error.details).toEqual({
      originalMessage: 'Database connection failed',
    });
  });
});

describe('DatabaseError', () => {
  it('should return 500 status code', () => {
    const error = new DatabaseError();

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe(ERROR_CODES.DATABASE_ERROR);
    expect(error.message).toBe(ERROR_MESSAGES.DATABASE_ERROR);
  });

  it('should capture original error message', () => {
    const originalError = new Error('Firestore write failed');
    const error = new DatabaseError('Database operation failed', originalError);

    expect(error.details).toEqual({
      originalMessage: 'Firestore write failed',
    });
  });

  it('should be marked as operational', () => {
    const error = new DatabaseError();

    expect(error.isOperational).toBe(true);
  });
});

describe('isAppError', () => {
  it('should return true for AppError instances', () => {
    expect(isAppError(new AppError('TEST', 'test', 400))).toBe(true);
    expect(isAppError(new ValidationError({ field: 'error' }))).toBe(true);
    expect(isAppError(new UnauthorizedError())).toBe(true);
    expect(isAppError(new NotFoundError())).toBe(true);
  });

  it('should return false for non-AppError instances', () => {
    expect(isAppError(new Error('test'))).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError('error string')).toBe(false);
    expect(isAppError({ code: 'ERROR', message: 'test' })).toBe(false);
  });
});

describe('isOperationalError', () => {
  it('should return true for operational errors', () => {
    expect(isOperationalError(new ValidationError({ field: 'error' }))).toBe(true);
    expect(isOperationalError(new UnauthorizedError())).toBe(true);
    expect(isOperationalError(new NotFoundError())).toBe(true);
    expect(isOperationalError(new DatabaseError())).toBe(true);
  });

  it('should return false for non-operational errors', () => {
    expect(isOperationalError(new InternalError())).toBe(false);
  });

  it('should return false for non-AppError instances', () => {
    expect(isOperationalError(new Error('test'))).toBe(false);
    expect(isOperationalError(null)).toBe(false);
    expect(isOperationalError(undefined)).toBe(false);
  });
});
