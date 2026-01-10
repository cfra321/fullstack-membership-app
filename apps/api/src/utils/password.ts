/**
 * Password Utilities
 *
 * Provides secure password hashing and verification using bcrypt.
 * Uses 12 salt rounds for a good balance of security and performance.
 */

import bcrypt from 'bcrypt';

import { PASSWORD } from '../config/constants';

/**
 * Hash a plain text password using bcrypt.
 *
 * @param password - The plain text password to hash
 * @returns A promise that resolves to the bcrypt hash
 *
 * @example
 * const hash = await hashPassword('userPassword123');
 * // Store hash in database
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD.SALT_ROUNDS);
}

/**
 * Verify a plain text password against a bcrypt hash.
 *
 * @param password - The plain text password to verify
 * @param hash - The bcrypt hash to compare against
 * @returns A promise that resolves to true if the password matches
 *
 * @example
 * const isValid = await verifyPassword('userPassword123', storedHash);
 * if (!isValid) {
 *   throw new InvalidCredentialsError();
 * }
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
