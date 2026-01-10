/**
 * User Repository
 *
 * Handles all user-related Firestore operations.
 * Provides CRUD operations for user documents.
 */

import {
  type User,
  type UserDocument,
  type MembershipType,
  type AuthProvider,
} from '@astronacci/shared';

import { getDb, COLLECTIONS } from '../config/firebase';

/**
 * Input data for creating a new user.
 */
export interface CreateUserInput {
  /** User's email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** Authentication provider used */
  authProvider: AuthProvider;
  /** Hashed password (only for email auth) */
  passwordHash?: string;
  /** Google OAuth ID */
  googleId?: string;
  /** Facebook OAuth ID */
  facebookId?: string;
  /** Initial membership type (defaults to 'A') */
  membershipType?: MembershipType;
}

/**
 * Fields that can be updated on a user document.
 */
export interface UpdateUserInput {
  /** Updated display name */
  displayName?: string;
  /** Updated membership type */
  membershipType?: MembershipType;
  /** Updated password hash */
  passwordHash?: string;
  /** Updated Google ID (for linking accounts) */
  googleId?: string;
  /** Updated Facebook ID (for linking accounts) */
  facebookId?: string;
}

/**
 * Convert Firestore document data to UserDocument.
 */
function toUserDocument(
  id: string,
  data: FirebaseFirestore.DocumentData
): UserDocument {
  return {
    id,
    email: data.email,
    displayName: data.displayName,
    membershipType: data.membershipType,
    authProvider: data.authProvider,
    passwordHash: data.passwordHash,
    googleId: data.googleId,
    facebookId: data.facebookId,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
  };
}

/**
 * Create a new user in Firestore.
 *
 * @param input - User creation data
 * @returns The created user document
 *
 * @example
 * const user = await createUser({
 *   email: 'user@example.com',
 *   displayName: 'John Doe',
 *   authProvider: 'email',
 *   passwordHash: await hashPassword('password123'),
 * });
 */
export async function createUser(input: CreateUserInput): Promise<UserDocument> {
  const db = getDb();
  const usersCollection = db.collection(COLLECTIONS.USERS);
  const docRef = usersCollection.doc();

  const now = new Date();

  // Build user data object, excluding undefined values (Firestore doesn't accept undefined)
  const userData: Record<string, unknown> = {
    email: input.email,
    displayName: input.displayName,
    authProvider: input.authProvider,
    membershipType: input.membershipType ?? 'A',
    createdAt: now,
    updatedAt: now,
  };

  // Only add optional fields if they have values
  if (input.passwordHash !== undefined) {
    userData.passwordHash = input.passwordHash;
  }
  if (input.googleId !== undefined) {
    userData.googleId = input.googleId;
  }
  if (input.facebookId !== undefined) {
    userData.facebookId = input.facebookId;
  }

  await docRef.set(userData);

  return {
    id: docRef.id,
    email: userData.email as string,
    displayName: userData.displayName as string,
    authProvider: userData.authProvider as AuthProvider,
    membershipType: userData.membershipType as MembershipType,
    passwordHash: userData.passwordHash as string | undefined,
    googleId: userData.googleId as string | undefined,
    facebookId: userData.facebookId as string | undefined,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Find a user by their email address.
 *
 * @param email - The email address to search for
 * @returns The user document if found, null otherwise
 *
 * @example
 * const user = await findByEmail('user@example.com');
 * if (user) {
 *   console.log('Found user:', user.displayName);
 * }
 */
export async function findByEmail(email: string): Promise<UserDocument | null> {
  const db = getDb();
  const usersCollection = db.collection(COLLECTIONS.USERS);

  const querySnapshot = await usersCollection
    .where('email', '==', email)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0]!;
  return toUserDocument(doc.id, doc.data());
}

/**
 * Find a user by their Firestore document ID.
 *
 * @param id - The user's document ID
 * @returns The user document if found, null otherwise
 *
 * @example
 * const user = await findById('abc123');
 */
export async function findById(id: string): Promise<UserDocument | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USERS).doc(id);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    return null;
  }

  return toUserDocument(docSnapshot.id, docSnapshot.data()!);
}

/**
 * Find a user by their Google OAuth ID.
 *
 * @param googleId - The Google OAuth user ID
 * @returns The user document if found, null otherwise
 *
 * @example
 * const user = await findByGoogleId('google-oauth-id-123');
 */
export async function findByGoogleId(googleId: string): Promise<UserDocument | null> {
  const db = getDb();
  const usersCollection = db.collection(COLLECTIONS.USERS);

  const querySnapshot = await usersCollection
    .where('googleId', '==', googleId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0]!;
  return toUserDocument(doc.id, doc.data());
}

/**
 * Find a user by their Facebook OAuth ID.
 *
 * @param facebookId - The Facebook OAuth user ID
 * @returns The user document if found, null otherwise
 *
 * @example
 * const user = await findByFacebookId('facebook-oauth-id-123');
 */
export async function findByFacebookId(facebookId: string): Promise<UserDocument | null> {
  const db = getDb();
  const usersCollection = db.collection(COLLECTIONS.USERS);

  const querySnapshot = await usersCollection
    .where('facebookId', '==', facebookId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0]!;
  return toUserDocument(doc.id, doc.data());
}

/**
 * Update an existing user document.
 *
 * @param id - The user's document ID
 * @param input - The fields to update
 *
 * @example
 * await updateUser('user-123', {
 *   displayName: 'New Name',
 *   membershipType: 'B',
 * });
 */
export async function updateUser(id: string, input: UpdateUserInput): Promise<void> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.USERS).doc(id);

  const updateData: Record<string, unknown> = {
    ...input,
    updatedAt: new Date(),
  };

  // Remove undefined values
  Object.keys(updateData).forEach((key) => {
    if (updateData[key] === undefined) {
      delete updateData[key];
    }
  });

  await docRef.update(updateData);
}

/**
 * Convert UserDocument to public User type (without sensitive fields).
 *
 * @param userDoc - The full user document
 * @returns Public user information
 */
export function toPublicUser(userDoc: UserDocument): User {
  return {
    id: userDoc.id,
    email: userDoc.email,
    displayName: userDoc.displayName,
    membershipType: userDoc.membershipType,
    authProvider: userDoc.authProvider,
  };
}
