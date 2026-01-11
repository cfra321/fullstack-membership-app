/**
 * Session Repository
 *
 * Handles all session-related Firestore operations.
 * Sessions are stored with the token as the document ID for fast lookups.
 */

import { getDb, COLLECTIONS } from '../config/firebase';

/**
 * Session document as stored in Firestore.
 */
export interface SessionDocument {
  /** Session token (also used as document ID) */
  token: string;
  /** User ID this session belongs to */
  userId: string;
  /** When the session expires */
  expiresAt: Date;
  /** When the session was created */
  createdAt: Date;
  /** User agent string from the request */
  userAgent?: string;
  /** IP address of the client */
  ipAddress?: string;
}

/**
 * Input data for creating a new session.
 */
export interface CreateSessionInput {
  /** Session token (will be used as document ID) */
  token: string;
  /** User ID this session belongs to */
  userId: string;
  /** When the session should expire */
  expiresAt: Date;
  /** User agent string from the request */
  userAgent?: string;
  /** IP address of the client */
  ipAddress?: string;
}

/**
 * Convert Firestore document data to SessionDocument.
 */
function toSessionDocument(
  id: string,
  data: FirebaseFirestore.DocumentData
): SessionDocument {
  return {
    token: id,
    userId: data.userId,
    expiresAt: data.expiresAt?.toDate?.() ?? data.expiresAt,
    createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
    userAgent: data.userAgent,
    ipAddress: data.ipAddress,
  };
}

/**
 * Create a new session in Firestore.
 * Uses the token as the document ID for fast lookups.
 *
 * @param input - Session creation data
 * @returns The created session document
 *
 * @example
 * const session = await createSession({
 *   token: generateSessionToken(),
 *   userId: user.id,
 *   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *   userAgent: req.get('User-Agent'),
 *   ipAddress: req.ip,
 * });
 */
export async function createSession(input: CreateSessionInput): Promise<SessionDocument> {
  const db = getDb();
  const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);

  // Use token as document ID for fast lookups
  const docRef = sessionsCollection.doc(input.token);

  const now = new Date();
  const sessionData: Omit<SessionDocument, 'token'> & { token: string } = {
    token: input.token,
    userId: input.userId,
    expiresAt: input.expiresAt,
    createdAt: now,
    userAgent: input.userAgent,
    ipAddress: input.ipAddress,
  };

  await docRef.set(sessionData);

  return sessionData;
}

/**
 * Find a session by its token.
 * Returns null if the session doesn't exist or has expired.
 *
 * @param token - The session token to look up
 * @returns The session document if found and valid, null otherwise
 *
 * @example
 * const session = await findByToken(req.cookies.session_token);
 * if (!session) {
 *   throw new UnauthorizedError();
 * }
 */
export async function findByToken(token: string): Promise<SessionDocument | null> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.SESSIONS).doc(token);

  const docSnapshot = await docRef.get();

  if (!docSnapshot.exists) {
    return null;
  }

  const session = toSessionDocument(docSnapshot.id, docSnapshot.data()!);

  // Check if session has expired
  if (session.expiresAt < new Date()) {
    return null;
  }

  return session;
}

/**
 * Delete a session by its token.
 * Used for logout functionality.
 *
 * @param token - The session token to delete
 *
 * @example
 * await deleteSession(req.cookies.session_token);
 * res.clearCookie('session_token');
 */
export async function deleteSession(token: string): Promise<void> {
  const db = getDb();
  const docRef = db.collection(COLLECTIONS.SESSIONS).doc(token);

  await docRef.delete();
}

/**
 * Delete all expired sessions from Firestore.
 * This should be run periodically to clean up stale sessions.
 *
 * @returns The number of sessions deleted
 *
 * @example
 * // Run as a scheduled job
 * const deleted = await deleteExpiredSessions();
 * console.log(`Cleaned up ${deleted} expired sessions`);
 */
export async function deleteExpiredSessions(): Promise<number> {
  const db = getDb();
  const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);

  const now = new Date();
  const querySnapshot = await sessionsCollection
    .where('expiresAt', '<', now)
    .get();

  if (querySnapshot.empty) {
    return 0;
  }

  // Delete all expired sessions
  const deletePromises = querySnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletePromises);

  return querySnapshot.docs.length;
}

/**
 * Delete all sessions for a specific user.
 * Used when a user wants to log out from all devices.
 *
 * @param userId - The user ID whose sessions should be deleted
 * @returns The number of sessions deleted
 *
 * @example
 * // Log out user from all devices
 * const deleted = await deleteUserSessions(user.id);
 */
export async function deleteUserSessions(userId: string): Promise<number> {
  const db = getDb();
  const sessionsCollection = db.collection(COLLECTIONS.SESSIONS);

  const querySnapshot = await sessionsCollection
    .where('userId', '==', userId)
    .get();

  if (querySnapshot.empty) {
    return 0;
  }

  // Delete all user sessions
  const deletePromises = querySnapshot.docs.map((doc) => doc.ref.delete());
  await Promise.all(deletePromises);

  return querySnapshot.docs.length;
}
