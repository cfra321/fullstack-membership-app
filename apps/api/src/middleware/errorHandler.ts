/**
 * Error Handler Middleware
 *
 * Global error handling middleware for Express.
 * Catches all errors and formats them into consistent API responses.
 */

import { type Request, type Response, type NextFunction } from 'express';

import { type ApiResponse } from '@astronacci/shared';

import { SERVER } from '../config/constants';
import { AppError, isAppError, isOperationalError, ValidationError } from '../utils/errors';

/**
 * Error response structure for API errors.
 */
interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
    details?: Record<string, unknown>;
  };
}

/**
 * Log error details for debugging.
 */
function logError(error: Error, req: Request): void {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  };

  // Log full details in development, minimal in production
  if (SERVER.IS_DEVELOPMENT) {
    console.error('Error:', errorInfo);
  } else {
    // In production, log structured error for aggregation services
    console.error(JSON.stringify({
      level: 'error',
      ...errorInfo,
      stack: undefined, // Don't log stack in production
    }));
  }
}

/**
 * Format AppError into API response.
 */
function formatAppError(error: AppError): ErrorResponseBody {
  if (error instanceof ValidationError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        fields: error.fields,
      },
    };
  }

  const response: ErrorResponseBody = {
    error: {
      code: error.code,
      message: error.message,
    },
  };

  // Include details if present
  if (error.details) {
    response.error.details = error.details;
  }

  return response;
}

/**
 * Format unknown error into API response.
 * Hides internal details in production.
 */
function formatUnknownError(error: Error): ErrorResponseBody {
  return {
    error: {
      code: 'INTERNAL_ERROR',
      message: SERVER.IS_PRODUCTION
        ? 'An unexpected error occurred'
        : error.message || 'An unexpected error occurred',
    },
  };
}

/**
 * Express error handler middleware.
 *
 * This should be registered as the last middleware in the Express app.
 * It catches all errors thrown by route handlers and other middleware.
 *
 * @example
 * app.use(errorHandler);
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log the error
  logError(error, req);

  // Determine status code and format response
  let statusCode: number;
  let responseBody: ErrorResponseBody;

  if (isAppError(error)) {
    statusCode = error.statusCode;
    responseBody = formatAppError(error);
  } else {
    // Unknown error - treat as internal server error
    statusCode = 500;
    responseBody = formatUnknownError(error);
  }

  // Send error response
  const response: ApiResponse = responseBody;
  res.status(statusCode).json(response);
}

/**
 * Not found handler for undefined routes.
 * Should be registered before the error handler.
 *
 * @example
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const response: ApiResponse = {
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  };
  res.status(404).json(response);
}

/**
 * Async route handler wrapper.
 * Catches errors from async route handlers and passes them to the error middleware.
 *
 * @example
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json({ data: users });
 * }));
 */
export function asyncHandler<T>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<T>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default errorHandler;
