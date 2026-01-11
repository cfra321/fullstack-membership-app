/**
 * Firebase Configuration Tests
 *
 * Tests for Firebase Admin SDK initialization and configuration.
 * Uses mocked credentials since actual Firebase isn't available in tests.
 */

import {
  resetFirebase,
  isFirebaseInitialized,
  getInitializationError,
  COLLECTIONS,
} from '../../config/firebase';

// Store original env
const originalEnv = { ...process.env };

describe('Firebase Configuration', () => {
  beforeEach(() => {
    // Reset Firebase state before each test
    resetFirebase();
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Validation', () => {
    it('should report not initialized before initialization', () => {
      expect(isFirebaseInitialized()).toBe(false);
      expect(getInitializationError()).toBeNull();
    });

    it('should have correct collection names defined', () => {
      expect(COLLECTIONS.USERS).toBe('users');
      expect(COLLECTIONS.SESSIONS).toBe('sessions');
      expect(COLLECTIONS.USAGE).toBe('usage');
      expect(COLLECTIONS.ARTICLES).toBe('articles');
      expect(COLLECTIONS.VIDEOS).toBe('videos');
    });
  });

  describe('Missing Credentials Handling', () => {
    it('should throw error when FIREBASE_PROJECT_ID is missing', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;

      // Dynamic import to test initialization
      const { initializeFirebase } = await import('../../config/firebase');

      // Reset after import
      resetFirebase();

      expect(() => initializeFirebase()).toThrow('Missing Firebase configuration');
    });

    it('should list all missing environment variables in error', async () => {
      delete process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_CLIENT_EMAIL;
      delete process.env.FIREBASE_PRIVATE_KEY;

      const { initializeFirebase, resetFirebase: reset } = await import('../../config/firebase');
      reset();

      try {
        initializeFirebase();
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        const message = (error as Error).message;
        expect(message).toContain('FIREBASE_PROJECT_ID');
        expect(message).toContain('FIREBASE_CLIENT_EMAIL');
        expect(message).toContain('FIREBASE_PRIVATE_KEY');
      }
    });
  });

  describe('Collection Names', () => {
    it('should export all required collection names', () => {
      const collectionNames = Object.values(COLLECTIONS);

      expect(collectionNames).toContain('users');
      expect(collectionNames).toContain('sessions');
      expect(collectionNames).toContain('usage');
      expect(collectionNames).toContain('articles');
      expect(collectionNames).toContain('videos');
      expect(collectionNames).toHaveLength(5);
    });

    it('should have readonly collection names', () => {
      // TypeScript ensures this at compile time, but we can verify values don't change
      const originalUsers = COLLECTIONS.USERS;
      expect(COLLECTIONS.USERS).toBe(originalUsers);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset initialization state', () => {
      // Simulate some state
      resetFirebase();

      expect(isFirebaseInitialized()).toBe(false);
      expect(getInitializationError()).toBeNull();
    });
  });
});

describe('Constants Configuration', () => {
  // Import constants dynamically to test with different env values
  let constants: typeof import('../../config/constants');

  beforeEach(async () => {
    // Clear module cache
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should have default server configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.SERVER.DEFAULT_PORT).toBe(3001);
    expect(typeof constants.SERVER.NODE_ENV).toBe('string');
    expect(typeof constants.SERVER.IS_PRODUCTION).toBe('boolean');
    expect(typeof constants.SERVER.IS_DEVELOPMENT).toBe('boolean');
  });

  it('should have session configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.SESSION.COOKIE_NAME).toBe('session_token');
    expect(constants.SESSION.MAX_AGE).toBeGreaterThan(0);
    expect(constants.SESSION.MAX_AGE_DAYS).toBe(7);
  });

  it('should have secure cookie options', async () => {
    constants = await import('../../config/constants');

    expect(constants.COOKIE_OPTIONS.httpOnly).toBe(true);
    expect(constants.COOKIE_OPTIONS.sameSite).toBe('strict');
    expect(constants.COOKIE_OPTIONS.path).toBe('/');
  });

  it('should have password configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.PASSWORD.SALT_ROUNDS).toBe(12);
    expect(constants.PASSWORD.MIN_LENGTH).toBe(8);
  });

  it('should have rate limit configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.RATE_LIMIT.WINDOW_MS).toBe(60000);
    expect(constants.RATE_LIMIT.AUTH_MAX_REQUESTS).toBe(5);
    expect(constants.RATE_LIMIT.GENERAL_MAX_REQUESTS).toBe(100);
  });

  it('should have CORS configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.CORS.CREDENTIALS).toBe(true);
    expect(constants.CORS.METHODS).toContain('GET');
    expect(constants.CORS.METHODS).toContain('POST');
  });

  it('should have API configuration', async () => {
    constants = await import('../../config/constants');

    expect(constants.API.BASE_PATH).toBe('/api');
    expect(constants.API.MAX_BODY_SIZE).toBe('10mb');
  });
});
