/**
 * Configuration exports
 */

// Firebase
export {
  initializeFirebase,
  getDb,
  isFirebaseInitialized,
  getInitializationError,
  resetFirebase,
  COLLECTIONS,
} from './firebase';

export type { CollectionName } from './firebase';

// Constants
export {
  SERVER,
  SESSION,
  COOKIE_OPTIONS,
  PASSWORD,
  RATE_LIMIT,
  CORS,
  API,
} from './constants';
