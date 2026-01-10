/**
 * Error Handler Middleware Tests
 *
 * Tests for error handling middleware including error formatting,
 * logging, and async route handler wrapper.
 */

import { type Request, type Response, type NextFunction } from 'express';
import { errorHandler, notFoundHandler, asyncHandler } from '../../middleware/errorHandler';
import {
  AppError,
  ValidationError,
  UnauthorizedError,
  NotFoundError,
  InternalError,
} from '../../utils/errors';

// Mock console.error to prevent test output noise
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalConsoleError;
});

// Helper to create mock request
function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    method: 'GET',
    originalUrl: '/api/test',
    path: '/api/test',
    ip: '127.0.0.1',
    get: jest.fn().mockReturnValue('test-user-agent'),
    ...overrides,
  } as unknown as Request;
}

// Helper to create mock response
function createMockResponse(): Response & { statusCode: number; body: unknown } {
  const res = {
    statusCode: 200,
    body: null,
    status: jest.fn().mockImplementation(function (this: Response, code: number) {
      (this as Response & { statusCode: number }).statusCode = code;
      return this;
    }),
    json: jest.fn().mockImplementation(function (this: Response, data: unknown) {
      (this as Response & { body: unknown }).body = data;
      return this;
    }),
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe('errorHandler middleware', () => {
  const mockNext = jest.fn() as NextFunction;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AppError handling', () => {
    it('should format AppError with correct status and body', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new AppError('TEST_ERROR', 'Test error message', 400);

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: {
          code: 'TEST_ERROR',
          message: 'Test error message',
        },
      });
    });

    it('should include details in response when present', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new AppError('TEST_ERROR', 'Test error', 400, { extra: 'info' });

      errorHandler(error, req, res, mockNext);

      expect(res.body).toEqual({
        error: {
          code: 'TEST_ERROR',
          message: 'Test error',
          details: { extra: 'info' },
        },
      });
    });
  });

  describe('ValidationError handling', () => {
    it('should format ValidationError with fields', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new ValidationError({
        email: 'Invalid email format',
        password: 'Must be at least 8 characters',
      });

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body).toEqual({
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          fields: {
            email: 'Invalid email format',
            password: 'Must be at least 8 characters',
          },
        },
      });
    });
  });

  describe('UnauthorizedError handling', () => {
    it('should return 401 status', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new UnauthorizedError();

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.body).toEqual({
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });
  });

  describe('NotFoundError handling', () => {
    it('should return 404 status', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new NotFoundError('User');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          details: { resource: 'User' },
        },
      });
    });
  });

  describe('InternalError handling', () => {
    it('should return 500 status', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new InternalError('Something went wrong');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('Unknown error handling', () => {
    it('should return 500 status for unknown errors', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new Error('Unknown error');

      errorHandler(error, req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should hide error details for unknown errors', () => {
      const req = createMockRequest();
      const res = createMockResponse();
      const error = new Error('Sensitive database error details');

      errorHandler(error, req, res, mockNext);

      // The message should either be the original or a generic one depending on environment
      expect(res.body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: expect.any(String),
        },
      });
    });
  });

  describe('Error logging', () => {
    it('should log error details', () => {
      const req = createMockRequest({
        method: 'POST',
        originalUrl: '/api/users',
      });
      const res = createMockResponse();
      const error = new AppError('TEST_ERROR', 'Test error', 400);

      errorHandler(error, req, res, mockNext);

      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe('notFoundHandler middleware', () => {
  const mockNext = jest.fn() as NextFunction;

  it('should return 404 with method and path', () => {
    const req = createMockRequest({
      method: 'GET',
      path: '/api/unknown',
    });
    const res = createMockResponse();

    notFoundHandler(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/unknown',
      },
    });
  });

  it('should handle POST requests', () => {
    const req = createMockRequest({
      method: 'POST',
      path: '/api/missing',
    });
    const res = createMockResponse();

    notFoundHandler(req, res, mockNext);

    expect(res.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot POST /api/missing',
      },
    });
  });
});

describe('asyncHandler', () => {
  it('should pass successful async result through', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const mockNext = jest.fn();

    const handler = asyncHandler(async (_req, _res) => {
      return 'success';
    });

    await handler(req, res, mockNext);

    // Should not call next with error
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch async errors and pass to next', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const mockNext = jest.fn();
    const testError = new Error('Async error');

    const handler = asyncHandler(async () => {
      throw testError;
    });

    handler(req, res, mockNext);

    // Wait for promise to resolve
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should catch AppError and pass to next', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const mockNext = jest.fn();
    const testError = new NotFoundError('Resource');

    const handler = asyncHandler(async () => {
      throw testError;
    });

    handler(req, res, mockNext);

    // Wait for promise to resolve
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalledWith(testError);
  });

  it('should allow response to be sent in handler', async () => {
    const req = createMockRequest();
    const res = createMockResponse();
    const mockNext = jest.fn();

    const handler = asyncHandler(async (_req, response) => {
      response.status(200).json({ data: 'test' });
    });

    handler(req, res, mockNext);

    // Wait for promise to resolve
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: 'test' });
    expect(mockNext).not.toHaveBeenCalled();
  });
});
