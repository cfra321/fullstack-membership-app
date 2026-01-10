/**
 * User Types and Interfaces
 *
 * Defines user-related types used across the application.
 */

import { type AuthProvider, type MembershipType } from './membership';

/**
 * Public user information returned by the API.
 * Does not include sensitive data like password hashes.
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** User's membership tier */
  membershipType: MembershipType;
  /** How the user authenticated */
  authProvider: AuthProvider;
}

/**
 * Complete user document as stored in Firestore.
 * Used internally by the backend.
 */
export interface UserDocument extends User {
  /** Hashed password (only for email auth) */
  passwordHash?: string;
  /** Google OAuth user ID */
  googleId?: string;
  /** Facebook OAuth user ID */
  facebookId?: string;
  /** Timestamp when user was created */
  createdAt: Date;
  /** Timestamp when user was last updated */
  updatedAt: Date;
}

/**
 * Input data for user registration.
 */
export interface RegisterInput {
  /** User's email address */
  email: string;
  /** User's password (will be hashed) */
  password: string;
  /** User's display name */
  displayName: string;
}

/**
 * Input data for user login.
 */
export interface LoginInput {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Result of a successful authentication.
 */
export interface AuthResult {
  /** Authenticated user */
  user: User;
  /** Session token for subsequent requests */
  sessionToken: string;
  /** When the session expires */
  expiresAt: Date;
}
