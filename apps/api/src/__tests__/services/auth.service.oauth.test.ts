/**
 * Auth Service Tests - Google OAuth
 *
 * Tests for Google OAuth authentication flow.
 */

import { type UserDocument } from '@astronacci/shared';

// Mock dependencies
const mockOAuth2Client = {
  generateAuthUrl: jest.fn(),
  getToken: jest.fn(),
};

const mockOauth2 = {
  userinfo: {
    get: jest.fn(),
  },
};

jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn(() => mockOAuth2Client),
    },
    oauth2: jest.fn(() => mockOauth2),
  },
}));

const mockCreateUser = jest.fn();
const mockFindByEmail = jest.fn();
const mockFindByGoogleId = jest.fn();
const mockUpdateUser = jest.fn();
const mockCreateSession = jest.fn();

jest.mock('../../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
  findByGoogleId: mockFindByGoogleId,
  updateUser: mockUpdateUser,
}));

jest.mock('../../services/session.service', () => ({
  createSession: mockCreateSession,
}));

// Mock OAuth config
jest.mock('../../config/oauth', () => ({
  GOOGLE_OAUTH: {
    CLIENT_ID: 'test-client-id',
    CLIENT_SECRET: 'test-client-secret',
    CALLBACK_URL: 'http://localhost:3001/api/auth/google/callback',
    SCOPES: ['email', 'profile'],
  },
  FRONTEND_URL: 'http://localhost:3000',
  validateGoogleOAuthConfig: jest.fn(() => ({ valid: true, missing: [] })),
}));

import {
  getGoogleAuthUrl,
  handleGoogleCallback,
} from '../../services/auth.service';
import { InternalError } from '../../utils/errors';

describe('Auth Service - Google OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('should return valid OAuth URL', () => {
      const expectedUrl = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=test&scope=email';
      mockOAuth2Client.generateAuthUrl.mockReturnValue(expectedUrl);

      const url = getGoogleAuthUrl();

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith({
        access_type: 'offline',
        scope: expect.any(Array),
        prompt: 'consent',
      });
      expect(url).toBe(expectedUrl);
    });

    it('should include required scopes', () => {
      mockOAuth2Client.generateAuthUrl.mockReturnValue('https://...');

      getGoogleAuthUrl();

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: expect.arrayContaining(['email', 'profile']),
        })
      );
    });

    it('should accept optional state parameter', () => {
      mockOAuth2Client.generateAuthUrl.mockReturnValue('https://...');

      getGoogleAuthUrl('custom-state-123');

      expect(mockOAuth2Client.generateAuthUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'custom-state-123',
        })
      );
    });
  });

  describe('handleGoogleCallback', () => {
    const mockGoogleUserInfo = {
      data: {
        id: 'google-user-id-123',
        email: 'google-user@gmail.com',
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
      },
    };

    beforeEach(() => {
      mockOAuth2Client.getToken.mockResolvedValue({
        tokens: {
          access_token: 'mock-access-token',
          id_token: 'mock-id-token',
        },
      });
      mockOauth2.userinfo.get.mockResolvedValue(mockGoogleUserInfo);
    });

    it('should create new user on first login', async () => {
      const mockNewUser: UserDocument = {
        id: 'new-user-id',
        email: 'google-user@gmail.com',
        displayName: 'Google User',
        membershipType: 'A',
        authProvider: 'google',
        googleId: 'google-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token-123',
        userId: mockNewUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      mockFindByGoogleId.mockResolvedValue(null);
      mockFindByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(mockNewUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleGoogleCallback('auth-code-123');

      expect(mockOAuth2Client.getToken).toHaveBeenCalledWith('auth-code-123');
      expect(mockFindByGoogleId).toHaveBeenCalledWith('google-user-id-123');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'google-user@gmail.com',
        displayName: 'Google User',
        authProvider: 'google',
        googleId: 'google-user-id-123',
        membershipType: 'A',
      });
      expect(result.user.id).toBe(mockNewUser.id);
      expect(result.sessionToken).toBe(mockSession.token);
    });

    it('should update existing user on repeat login', async () => {
      const existingUser: UserDocument = {
        id: 'existing-user-id',
        email: 'google-user@gmail.com',
        displayName: 'Old Name',
        membershipType: 'B',
        authProvider: 'google',
        googleId: 'google-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token-456',
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      mockFindByGoogleId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleGoogleCallback('auth-code-456');

      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockCreateSession).toHaveBeenCalledWith(existingUser.id, expect.any(Object));
      expect(result.user.id).toBe(existingUser.id);
      expect(result.user.membershipType).toBe('B'); // Preserved existing membership
    });

    it('should create session and return token', async () => {
      const existingUser: UserDocument = {
        id: 'user-id',
        email: 'google-user@gmail.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'google',
        googleId: 'google-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'new-session-token',
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        createdAt: new Date(),
      };

      mockFindByGoogleId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleGoogleCallback('auth-code');

      expect(mockCreateSession).toHaveBeenCalled();
      expect(result.sessionToken).toBe('new-session-token');
      expect(result.expiresAt).toEqual(mockSession.expiresAt);
    });

    it('should handle OAuth failure gracefully', async () => {
      mockOAuth2Client.getToken.mockRejectedValue(new Error('Invalid authorization code'));

      await expect(handleGoogleCallback('invalid-code')).rejects.toThrow();
    });

    it('should link Google account to existing email user', async () => {
      const existingEmailUser: UserDocument = {
        id: 'email-user-id',
        email: 'google-user@gmail.com',
        displayName: 'Email User',
        membershipType: 'C',
        authProvider: 'email',
        passwordHash: 'hashedpw',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token',
        userId: existingEmailUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockFindByGoogleId.mockResolvedValue(null);
      mockFindByEmail.mockResolvedValue(existingEmailUser);
      mockUpdateUser.mockResolvedValue(undefined);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleGoogleCallback('auth-code');

      expect(mockUpdateUser).toHaveBeenCalledWith(existingEmailUser.id, {
        googleId: 'google-user-id-123',
      });
      expect(result.user.id).toBe(existingEmailUser.id);
    });

    it('should pass session options when provided', async () => {
      const existingUser: UserDocument = {
        id: 'user-id',
        email: 'google-user@gmail.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'google',
        googleId: 'google-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'token',
        userId: existingUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockFindByGoogleId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const options = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await handleGoogleCallback('auth-code', options);

      expect(mockCreateSession).toHaveBeenCalledWith(existingUser.id, options);
    });
  });

  describe('Error handling', () => {
    it('should throw InternalError when Google API fails', async () => {
      mockOAuth2Client.getToken.mockResolvedValue({
        tokens: { access_token: 'token' },
      });
      mockOauth2.userinfo.get.mockRejectedValue(new Error('Google API error'));

      await expect(handleGoogleCallback('code')).rejects.toThrow(InternalError);
    });

    it('should throw InternalError when user info is missing email', async () => {
      mockOAuth2Client.getToken.mockResolvedValue({
        tokens: { access_token: 'token' },
      });
      mockOauth2.userinfo.get.mockResolvedValue({
        data: {
          id: 'google-id',
          // Missing email
          name: 'User',
        },
      });

      await expect(handleGoogleCallback('code')).rejects.toThrow(InternalError);
    });
  });
});
