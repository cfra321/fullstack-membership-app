/**
 * Auth Service Tests - Registration and Login
 *
 * Tests for manual registration, login, and logout flows.
 */

import { type UserDocument } from '@astronacci/shared';

// Mock dependencies
const mockHashPassword = jest.fn();
const mockVerifyPassword = jest.fn();
const mockCreateUser = jest.fn();
const mockFindByEmail = jest.fn();
const mockCreateSession = jest.fn();
const mockInvalidateSession = jest.fn();

jest.mock('../../utils/password', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword,
}));

jest.mock('../../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
}));

jest.mock('../../services/session.service', () => ({
  createSession: mockCreateSession,
  invalidateSession: mockInvalidateSession,
}));

import { register, login, logout } from '../../services/auth.service';
import { EmailExistsError, InvalidCredentialsError, ValidationError } from '../../utils/errors';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      const input = {
        email: 'newuser@example.com',
        password: 'SecurePass123',
        displayName: 'New User',
      };
      const hashedPassword = '$2b$12$hashedpassword';
      const mockUser: UserDocument = {
        id: 'new-user-id',
        email: input.email,
        displayName: input.displayName,
        membershipType: 'A',
        authProvider: 'email',
        passwordHash: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue(hashedPassword);
      mockCreateUser.mockResolvedValue(mockUser);

      const result = await register(input);

      expect(mockHashPassword).toHaveBeenCalledWith('SecurePass123');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: input.email,
        displayName: input.displayName,
        authProvider: 'email',
        passwordHash: hashedPassword,
        membershipType: 'A',
      });
      expect(result.id).toBe('new-user-id');
      expect(result.email).toBe(input.email);
    });

    it('should reject duplicate email', async () => {
      const input = {
        email: 'existing@example.com',
        password: 'SecurePass123',
        displayName: 'Duplicate User',
      };
      const existingUser: UserDocument = {
        id: 'existing-id',
        email: input.email,
        displayName: 'Existing User',
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(existingUser);

      await expect(register(input)).rejects.toThrow(EmailExistsError);
      expect(mockHashPassword).not.toHaveBeenCalled();
      expect(mockCreateUser).not.toHaveBeenCalled();
    });

    it('should assign default membership Type A', async () => {
      const input = {
        email: 'member@example.com',
        password: 'SecurePass123',
        displayName: 'Member User',
      };
      const mockUser: UserDocument = {
        id: 'member-id',
        email: input.email,
        displayName: input.displayName,
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashedpw');
      mockCreateUser.mockResolvedValue(mockUser);

      const result = await register(input);

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          membershipType: 'A',
        })
      );
      expect(result.membershipType).toBe('A');
    });

    it('should reject invalid email format', async () => {
      const input = {
        email: 'invalid-email',
        password: 'SecurePass123',
        displayName: 'Invalid Email User',
      };

      await expect(register(input)).rejects.toThrow(ValidationError);
    });

    it('should reject password shorter than 8 characters', async () => {
      const input = {
        email: 'user@example.com',
        password: 'short',
        displayName: 'Short Password User',
      };

      await expect(register(input)).rejects.toThrow(ValidationError);
    });

    it('should reject empty display name', async () => {
      const input = {
        email: 'user@example.com',
        password: 'SecurePass123',
        displayName: '',
      };

      await expect(register(input)).rejects.toThrow(ValidationError);
    });
  });

  describe('login', () => {
    it('should return session for valid credentials', async () => {
      const email = 'user@example.com';
      const password = 'CorrectPassword123';
      const mockUser: UserDocument = {
        id: 'user-123',
        email,
        displayName: 'Test User',
        membershipType: 'B',
        authProvider: 'email',
        passwordHash: '$2b$12$hashedCorrectPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token-abc123',
        userId: mockUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await login(email, password);

      expect(mockFindByEmail).toHaveBeenCalledWith(email);
      expect(mockVerifyPassword).toHaveBeenCalledWith(password, mockUser.passwordHash);
      expect(mockCreateSession).toHaveBeenCalledWith(mockUser.id, expect.any(Object));
      expect(result.user.id).toBe(mockUser.id);
      expect(result.sessionToken).toBe(mockSession.token);
      expect(result.expiresAt).toBe(mockSession.expiresAt);
    });

    it('should reject invalid password', async () => {
      const email = 'user@example.com';
      const password = 'WrongPassword';
      const mockUser: UserDocument = {
        id: 'user-123',
        email,
        displayName: 'Test User',
        membershipType: 'A',
        authProvider: 'email',
        passwordHash: '$2b$12$hashedCorrectPassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue(false);

      await expect(login(email, password)).rejects.toThrow(InvalidCredentialsError);
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('should reject non-existent email', async () => {
      const email = 'nonexistent@example.com';
      const password = 'SomePassword123';

      mockFindByEmail.mockResolvedValue(null);

      await expect(login(email, password)).rejects.toThrow(InvalidCredentialsError);
      expect(mockVerifyPassword).not.toHaveBeenCalled();
      expect(mockCreateSession).not.toHaveBeenCalled();
    });

    it('should reject OAuth user trying to login with password', async () => {
      const email = 'google-user@example.com';
      const password = 'SomePassword123';
      const mockUser: UserDocument = {
        id: 'google-user-id',
        email,
        displayName: 'Google User',
        membershipType: 'A',
        authProvider: 'google',
        googleId: 'google-123',
        // No passwordHash for OAuth users
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(mockUser);

      await expect(login(email, password)).rejects.toThrow(InvalidCredentialsError);
      expect(mockVerifyPassword).not.toHaveBeenCalled();
    });

    it('should pass session options to createSession', async () => {
      const email = 'user@example.com';
      const password = 'CorrectPassword123';
      const options = {
        userAgent: 'Mozilla/5.0 Chrome/120',
        ipAddress: '192.168.1.1',
      };
      const mockUser: UserDocument = {
        id: 'user-123',
        email,
        displayName: 'Test User',
        membershipType: 'A',
        authProvider: 'email',
        passwordHash: '$2b$12$hashedpw',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'token',
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);
      mockCreateSession.mockResolvedValue(mockSession);

      await login(email, password, options);

      expect(mockCreateSession).toHaveBeenCalledWith(mockUser.id, options);
    });
  });

  describe('logout', () => {
    it('should invalidate session', async () => {
      const token = 'session-token-to-logout';

      mockInvalidateSession.mockResolvedValue(undefined);

      await logout(token);

      expect(mockInvalidateSession).toHaveBeenCalledWith(token);
    });

    it('should not throw if session does not exist', async () => {
      const token = 'nonexistent-token';

      mockInvalidateSession.mockResolvedValue(undefined);

      await expect(logout(token)).resolves.not.toThrow();
    });
  });

  describe('Input validation', () => {
    it('should trim email before checking', async () => {
      const input = {
        email: '  user@example.com  ',
        password: 'SecurePass123',
        displayName: 'User',
      };
      const mockUser: UserDocument = {
        id: 'user-id',
        email: 'user@example.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hash');
      mockCreateUser.mockResolvedValue(mockUser);

      await register(input);

      expect(mockFindByEmail).toHaveBeenCalledWith('user@example.com');
      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        })
      );
    });

    it('should lowercase email before storing', async () => {
      const input = {
        email: 'User@EXAMPLE.com',
        password: 'SecurePass123',
        displayName: 'User',
      };
      const mockUser: UserDocument = {
        id: 'user-id',
        email: 'user@example.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'email',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockFindByEmail.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hash');
      mockCreateUser.mockResolvedValue(mockUser);

      await register(input);

      expect(mockCreateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'user@example.com',
        })
      );
    });
  });
});
