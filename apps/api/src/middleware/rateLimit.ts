/**
 * Rate Limiting Middleware
 *
 * Provides rate limiting to prevent brute force attacks and abuse.
 * Uses express-rate-limit with custom error responses matching the API format.
 */

import rateLimit, { type Options } from 'express-rate-limit';

import { ERROR_CODES, ERROR_MESSAGES } from '@astronacci/shared';

import { RATE_LIMIT } from '../config/constants';

/**
 * Rate limiter configuration options.
 */
export interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs?: number;
  /** Maximum requests per window */
  max?: number;
}

/**
 * Create a rate limiter for authentication endpoints.
 *
 * Uses stricter limits (5 requests per minute by default) to prevent
 * brute force attacks on login and registration endpoints.
 *
 * @param options - Optional configuration overrides
 * @returns Express middleware function
 *
 * @example
 * // Use default settings (5 requests per minute)
 * router.use('/auth', createAuthRateLimiter());
 *
 * @example
 * // Custom settings
 * router.use('/auth', createAuthRateLimiter({ max: 3, windowMs: 30000 }));
 */
export function createAuthRateLimiter(options: RateLimiterOptions = {}) {
  const config: Partial<Options> = {
    windowMs: options.windowMs ?? RATE_LIMIT.WINDOW_MS,
    max: options.max ?? RATE_LIMIT.AUTH_MAX_REQUESTS,
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    message: {
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: ERROR_MESSAGES.RATE_LIMITED,
      },
    },
    // Skip successful requests in some scenarios (optional)
    skipSuccessfulRequests: false,
    // Skip failed requests (optional, useful for login where only failures count)
    skipFailedRequests: false,
  };

  return rateLimit(config);
}

/**
 * Create a rate limiter for general API endpoints.
 *
 * Uses more relaxed limits (100 requests per minute by default) for
 * normal API operations.
 *
 * @param options - Optional configuration overrides
 * @returns Express middleware function
 *
 * @example
 * // Use default settings (100 requests per minute)
 * app.use('/api', createGeneralRateLimiter());
 */
export function createGeneralRateLimiter(options: RateLimiterOptions = {}) {
  const config: Partial<Options> = {
    windowMs: options.windowMs ?? RATE_LIMIT.WINDOW_MS,
    max: options.max ?? RATE_LIMIT.GENERAL_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: {
        code: ERROR_CODES.RATE_LIMITED,
        message: ERROR_MESSAGES.RATE_LIMITED,
      },
    },
  };

  return rateLimit(config);
}

/**
 * Pre-configured auth rate limiter with default settings.
 * Use this for standard auth endpoint protection.
 */
export const authRateLimiter = createAuthRateLimiter();

/**
 * Pre-configured general rate limiter with default settings.
 * Use this for standard API endpoint protection.
 */
export const generalRateLimiter = createGeneralRateLimiter();
