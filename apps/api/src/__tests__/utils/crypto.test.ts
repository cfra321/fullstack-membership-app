/**
 * Password and Crypto Utilities Tests
 *
 * Tests for password hashing with bcrypt and secure token generation.
 */

import { hashPassword, verifyPassword } from '../../utils/password';
import { generateSessionToken } from '../../utils/crypto';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should create a bcrypt hash', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      // bcrypt hashes start with $2a$ or $2b$
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('should create different hashes for the same password', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should create a hash of appropriate length', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      // bcrypt hashes are 60 characters
      expect(hash.length).toBe(60);
    });

    it('should handle empty password', async () => {
      const hash = await hashPassword('');

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^\$2[ab]\$/);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@$$w0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'パスワード123🔐';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(60);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for wrong password', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await hashPassword(password);

      const result = await verifyPassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for similar but different password', async () => {
      const password = 'TestPassword123';
      const similarPassword = 'TestPassword124'; // Just one character different
      const hash = await hashPassword(password);

      const result = await verifyPassword(similarPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for case-different password', async () => {
      const password = 'TestPassword123';
      const casePassword = 'testpassword123';
      const hash = await hashPassword(password);

      const result = await verifyPassword(casePassword, hash);

      expect(result).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      const password = 'P@$$w0rd!#$%^&*()';
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword('P@$$w0rd!#$%^&*()', hash)).toBe(true);
      expect(await verifyPassword('P@$$w0rd!#$%^&*(', hash)).toBe(false);
    });

    it('should handle unicode characters correctly', async () => {
      const password = 'パスワード123🔐';
      const hash = await hashPassword(password);

      expect(await verifyPassword(password, hash)).toBe(true);
      expect(await verifyPassword('パスワード123', hash)).toBe(false);
    });

    it('should handle empty password correctly', async () => {
      const hash = await hashPassword('');

      expect(await verifyPassword('', hash)).toBe(true);
      expect(await verifyPassword(' ', hash)).toBe(false);
    });
  });
});

describe('Crypto Utilities', () => {
  describe('generateSessionToken', () => {
    it('should return a 64-character hex string (256 bits)', () => {
      const token = generateSessionToken();

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBe(64);
    });

    it('should only contain hexadecimal characters', () => {
      const token = generateSessionToken();

      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        tokens.add(generateSessionToken());
      }

      expect(tokens.size).toBe(iterations);
    });

    it('should generate cryptographically random tokens', () => {
      // Generate many tokens and check they don't follow obvious patterns
      const tokens: string[] = [];
      for (let i = 0; i < 100; i++) {
        tokens.push(generateSessionToken());
      }

      // No two tokens should be the same
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(100);

      // Tokens should not have the same prefix (first 8 chars)
      const prefixes = tokens.map((t) => t.substring(0, 8));
      const uniquePrefixes = new Set(prefixes);
      // Allow some collision but expect mostly unique
      expect(uniquePrefixes.size).toBeGreaterThan(90);
    });

    it('should have sufficient entropy for each generation', () => {
      // Generate two consecutive tokens
      const token1 = generateSessionToken();
      const token2 = generateSessionToken();

      // They must be different
      expect(token1).not.toBe(token2);

      // They should differ by more than just one character
      let differences = 0;
      for (let i = 0; i < token1.length; i++) {
        if (token1[i] !== token2[i]) {
          differences++;
        }
      }
      // Expect significant difference (at least 25% of characters)
      expect(differences).toBeGreaterThan(16);
    });
  });
});
