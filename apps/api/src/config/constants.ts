/**
 * Application Constants
 *
 * Centralized configuration constants for the API server.
 */

/**
 * Server configuration
 */
export const SERVER = {
  /** Default port if not specified in environment */
  DEFAULT_PORT: 3001,
  /** Current environment */
  NODE_ENV: process.env.NODE_ENV || 'development',
  /** Whether we're in production mode */
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  /** Whether we're in development mode */
  IS_DEVELOPMENT: process.env.NODE_ENV !== 'production',
} as const;

/**
 * Session configuration
 */
export const SESSION = {
  /** Cookie name for session token */
  COOKIE_NAME: 'session_token',
  /** Session duration in milliseconds (default: 7 days) */
  MAX_AGE: parseInt(process.env.SESSION_MAX_AGE || '604800000', 10),
  /** Session duration in days */
  MAX_AGE_DAYS: 7,
} as const;

/**
 * Cookie configuration for sessions
 */
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: SESSION.MAX_AGE,
  path: '/',
};

/**
 * Password hashing configuration
 */
export const PASSWORD = {
  /** bcrypt salt rounds */
  SALT_ROUNDS: 12,
  /** Minimum password length */
  MIN_LENGTH: 8,
} as const;

/**
 * Rate limiting configuration
 */
export const RATE_LIMIT = {
  /** Time window in milliseconds (1 minute) */
  WINDOW_MS: 60 * 1000,
  /** Maximum requests per window for auth endpoints */
  AUTH_MAX_REQUESTS: 5,
  /** Maximum requests per window for general endpoints */
  GENERAL_MAX_REQUESTS: 100,
} as const;

/**
 * CORS configuration
 */
export const CORS = {
  /** Allowed origin for CORS */
  ORIGIN: process.env.FRONTEND_URL || 'http://localhost:3000',
  /** Allowed HTTP methods */
  METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  /** Allowed headers */
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
  /** Whether to allow credentials (cookies) */
  CREDENTIALS: true,
} as const;

/**
 * API configuration
 */
export const API = {
  /** Base path for all API routes */
  BASE_PATH: '/api',
  /** Maximum request body size */
  MAX_BODY_SIZE: '10mb',
} as const;
