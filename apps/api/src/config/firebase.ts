/**
 * Firebase Admin SDK Configuration
 *
 * Initializes Firebase Admin SDK with service account credentials.
 * All Firestore access goes through this module.
 */

import { cert, getApps, initializeApp, type App, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

/**
 * Firebase initialization state
 */
let firebaseApp: App | null = null;
let firestoreDb: Firestore | null = null;
let initializationError: Error | null = null;

/**
 * Check if all required Firebase environment variables are set.
 */
function validateFirebaseConfig(): { valid: boolean; missing: string[] } {
  const required = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Initialize Firebase Admin SDK.
 * This function is idempotent - it will only initialize once.
 *
 * @returns The Firebase App instance
 * @throws Error if credentials are missing or invalid
 */
export function initializeFirebase(): App {
  // Return existing app if already initialized
  if (firebaseApp) {
    return firebaseApp;
  }

  // Check if already initialized by another module
  const existingApps = getApps();
  if (existingApps.length > 0) {
    firebaseApp = existingApps[0]!;
    return firebaseApp;
  }

  // Validate configuration
  const config = validateFirebaseConfig();
  if (!config.valid) {
    initializationError = new Error(
      `Missing Firebase configuration: ${config.missing.join(', ')}. ` +
        'Please set these environment variables.'
    );
    throw initializationError;
  }

  try {
    // Build service account credentials from environment variables
    const serviceAccount: ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      // Private key may have escaped newlines that need to be converted
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    };

    // Initialize the app
    firebaseApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    console.log('Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    initializationError = error instanceof Error ? error : new Error(String(error));
    console.error('Failed to initialize Firebase Admin SDK:', initializationError.message);
    throw initializationError;
  }
}

/**
 * Get the Firestore database instance.
 * Initializes Firebase if not already done.
 *
 * @returns The Firestore database instance
 * @throws Error if Firebase initialization fails
 */
export function getDb(): Firestore {
  if (firestoreDb) {
    return firestoreDb;
  }

  // Ensure Firebase is initialized
  initializeFirebase();

  // Get Firestore instance
  firestoreDb = getFirestore();
  return firestoreDb;
}

/**
 * Check if Firebase has been successfully initialized.
 */
export function isFirebaseInitialized(): boolean {
  return firebaseApp !== null && initializationError === null;
}

/**
 * Get any initialization error that occurred.
 */
export function getInitializationError(): Error | null {
  return initializationError;
}

/**
 * Reset Firebase state (mainly for testing).
 * In production, this should rarely if ever be used.
 */
export function resetFirebase(): void {
  firebaseApp = null;
  firestoreDb = null;
  initializationError = null;
}

// Collection names as constants for type safety
export const COLLECTIONS = {
  USERS: 'users',
  SESSIONS: 'sessions',
  USAGE: 'usage',
  ARTICLES: 'articles',
  VIDEOS: 'videos',
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];
