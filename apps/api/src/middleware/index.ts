/**
 * Middleware exports
 */

export { errorHandler, notFoundHandler, asyncHandler } from './errorHandler';

export {
  createAuthRateLimiter,
  createGeneralRateLimiter,
  authRateLimiter,
  generalRateLimiter,
  type RateLimiterOptions,
} from './rateLimit';

export {
  requireAuth,
  optionalAuth,
  isAuthenticated,
  getAuthenticatedUser,
  type AuthenticatedRequest,
} from './auth';
