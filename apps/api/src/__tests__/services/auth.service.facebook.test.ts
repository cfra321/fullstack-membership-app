/**
 * Auth Service Tests - Facebook OAuth
 *
 * Tests for Facebook OAuth authentication flow.
 */

import { type UserDocument } from '@astronacci/shared';

// Mock dependencies
const mockCreateUser = jest.fn();
const mockFindByEmail = jest.fn();
const mockFindByFacebookId = jest.fn();
const mockUpdateUser = jest.fn();
const mockCreateSession = jest.fn();

jest.mock('../../repositories/user.repository', () => ({
  createUser: mockCreateUser,
  findByEmail: mockFindByEmail,
  findByFacebookId: mockFindByFacebookId,
  updateUser: mockUpdateUser,
}));

jest.mock('../../services/session.service', () => ({
  createSession: mockCreateSession,
}));

// Mock OAuth config
jest.mock('../../config/oauth', () => ({
  FACEBOOK_OAUTH: {
    APP_ID: 'test-app-id',
    APP_SECRET: 'test-app-secret',
    CALLBACK_URL: 'http://localhost:3001/api/auth/facebook/callback',
    SCOPES: ['email', 'public_profile'],
    API_VERSION: 'v18.0',
  },
  FRONTEND_URL: 'http://localhost:3000',
}));

// Mock global fetch for Facebook API calls
const mockFetch = jest.fn();
global.fetch = mockFetch;

import {
  getFacebookAuthUrl,
  handleFacebookCallback,
} from '../../services/auth.service';
import { InternalError } from '../../utils/errors';

describe('Auth Service - Facebook OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  describe('getFacebookAuthUrl', () => {
    it('should return valid OAuth URL', () => {
      const url = getFacebookAuthUrl();

      expect(url).toContain('https://www.facebook.com/');
      expect(url).toContain('dialog/oauth');
      expect(url).toContain('client_id=test-app-id');
    });

    it('should include required scopes', () => {
      const url = getFacebookAuthUrl();

      expect(url).toContain('scope=');
      expect(url).toContain('email');
      expect(url).toContain('public_profile');
    });

    it('should include callback URL', () => {
      const url = getFacebookAuthUrl();

      expect(url).toContain('redirect_uri=');
      expect(url).toContain(encodeURIComponent('http://localhost:3001/api/auth/facebook/callback'));
    });

    it('should accept optional state parameter', () => {
      const url = getFacebookAuthUrl('custom-state-123');

      expect(url).toContain('state=custom-state-123');
    });
  });

  describe('handleFacebookCallback', () => {
    const mockFacebookUserInfo = {
      id: 'facebook-user-id-123',
      email: 'facebook-user@email.com',
      name: 'Facebook User',
      picture: {
        data: {
          url: 'https://platform-lookaside.fbsbx.com/photo.jpg',
        },
      },
    };

    beforeEach(() => {
      // Mock successful token exchange
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('oauth/access_token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'mock-access-token',
              token_type: 'bearer',
              expires_in: 5183944,
            }),
          });
        }
        if (url.includes('/me?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockFacebookUserInfo),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });
    });

    it('should create new user on first login', async () => {
      const mockNewUser: UserDocument = {
        id: 'new-user-id',
        email: 'facebook-user@email.com',
        displayName: 'Facebook User',
        membershipType: 'A',
        authProvider: 'facebook',
        facebookId: 'facebook-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token-123',
        userId: mockNewUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      mockFindByFacebookId.mockResolvedValue(null);
      mockFindByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(mockNewUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleFacebookCallback('auth-code-123');

      expect(mockFindByFacebookId).toHaveBeenCalledWith('facebook-user-id-123');
      expect(mockCreateUser).toHaveBeenCalledWith({
        email: 'facebook-user@email.com',
        displayName: 'Facebook User',
        authProvider: 'facebook',
        facebookId: 'facebook-user-id-123',
        membershipType: 'A',
      });
      expect(result.user.id).toBe(mockNewUser.id);
      expect(result.sessionToken).toBe(mockSession.token);
    });

    it('should update existing user on repeat login', async () => {
      const existingUser: UserDocument = {
        id: 'existing-user-id',
        email: 'facebook-user@email.com',
        displayName: 'Old Name',
        membershipType: 'B',
        authProvider: 'facebook',
        facebookId: 'facebook-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'session-token-456',
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 86400000),
        createdAt: new Date(),
      };

      mockFindByFacebookId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleFacebookCallback('auth-code-456');

      expect(mockCreateUser).not.toHaveBeenCalled();
      expect(mockCreateSession).toHaveBeenCalledWith(existingUser.id, expect.any(Object));
      expect(result.user.id).toBe(existingUser.id);
      expect(result.user.membershipType).toBe('B'); // Preserved existing membership
    });

    it('should create session and return token', async () => {
      const existingUser: UserDocument = {
        id: 'user-id',
        email: 'facebook-user@email.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'facebook',
        facebookId: 'facebook-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'new-session-token',
        userId: existingUser.id,
        expiresAt: new Date(Date.now() + 7 * 86400000),
        createdAt: new Date(),
      };

      mockFindByFacebookId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleFacebookCallback('auth-code');

      expect(mockCreateSession).toHaveBeenCalled();
      expect(result.sessionToken).toBe('new-session-token');
      expect(result.expiresAt).toEqual(mockSession.expiresAt);
    });

    it('should handle OAuth failure gracefully', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: {
              message: 'Invalid authorization code',
              type: 'OAuthException',
              code: 100,
            },
          }),
        });
      });

      await expect(handleFacebookCallback('invalid-code')).rejects.toThrow();
    });

    it('should link Facebook account to existing email user', async () => {
      const existingEmailUser: UserDocument = {
        id: 'email-user-id',
        email: 'facebook-user@email.com',
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

      mockFindByFacebookId.mockResolvedValue(null);
      mockFindByEmail.mockResolvedValue(existingEmailUser);
      mockUpdateUser.mockResolvedValue(undefined);
      mockCreateSession.mockResolvedValue(mockSession);

      const result = await handleFacebookCallback('auth-code');

      expect(mockUpdateUser).toHaveBeenCalledWith(existingEmailUser.id, {
        facebookId: 'facebook-user-id-123',
      });
      expect(result.user.id).toBe(existingEmailUser.id);
    });

    it('should pass session options when provided', async () => {
      const existingUser: UserDocument = {
        id: 'user-id',
        email: 'facebook-user@email.com',
        displayName: 'User',
        membershipType: 'A',
        authProvider: 'facebook',
        facebookId: 'facebook-user-id-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockSession = {
        token: 'token',
        userId: existingUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockFindByFacebookId.mockResolvedValue(existingUser);
      mockCreateSession.mockResolvedValue(mockSession);

      const options = {
        userAgent: 'Mozilla/5.0',
        ipAddress: '192.168.1.1',
      };

      await handleFacebookCallback('auth-code', options);

      expect(mockCreateSession).toHaveBeenCalledWith(existingUser.id, options);
    });

    it('should handle user without email gracefully', async () => {
      // Some Facebook users may not have email
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('oauth/access_token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'mock-access-token',
            }),
          });
        }
        if (url.includes('/me?')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              id: 'facebook-user-id-456',
              name: 'No Email User',
              // No email field
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      await expect(handleFacebookCallback('code')).rejects.toThrow(InternalError);
    });
  });

  describe('Error handling', () => {
    it('should throw InternalError when token exchange fails', async () => {
      mockFetch.mockImplementation(() => {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({
            error: {
              message: 'Facebook API error',
              type: 'OAuthException',
              code: 190,
            },
          }),
        });
      });

      await expect(handleFacebookCallback('code')).rejects.toThrow(InternalError);
    });

    it('should throw InternalError when user info fetch fails', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('oauth/access_token')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              access_token: 'mock-access-token',
            }),
          });
        }
        if (url.includes('/me?')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: {
                message: 'User info fetch failed',
              },
            }),
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      await expect(handleFacebookCallback('code')).rejects.toThrow(InternalError);
    });

    it('should throw InternalError on network error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(handleFacebookCallback('code')).rejects.toThrow(InternalError);
    });
  });
});
