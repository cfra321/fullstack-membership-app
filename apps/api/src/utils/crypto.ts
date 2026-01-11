/**
 * Cryptographic Utilities
 *
 * Provides secure random token generation for session management.
 * Uses Node.js crypto module for cryptographically secure random bytes.
 */

import { randomBytes } from 'crypto';

/**
 * Generate a cryptographically secure session token.
 *
 * Creates a 256-bit (32 bytes) random token encoded as a 64-character
 * hexadecimal string. This provides sufficient entropy for secure
 * session identification.
 *
 * @returns A 64-character hexadecimal string representing 256 bits of randomness
 *
 * @example
 * const sessionToken = generateSessionToken();
 * // Returns something like: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
 *
 * @security
 * - Uses crypto.randomBytes() which is cryptographically secure
 * - 256 bits provides 2^256 possible tokens, making guessing infeasible
 * - Suitable for session tokens, CSRF tokens, and similar security purposes
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}
