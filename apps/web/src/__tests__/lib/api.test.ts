/**
 * API Client Tests
 *
 * Tests for the API client fetch wrapper.
 * Validates credential handling, response parsing, and error handling.
 */

import { apiClient, api, ApiError } from '../../lib/api';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('apiClient', () => {
    describe('credentials', () => {
      it('includes credentials for cookies', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: { message: 'success' } }),
        });

        await apiClient('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            credentials: 'include',
          })
        );
      });

      it('sets Content-Type to application/json', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
            }),
          })
        );
      });

      it('allows custom headers', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test', {
          headers: { 'X-Custom-Header': 'custom-value' },
        });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'X-Custom-Header': 'custom-value',
            }),
          })
        );
      });
    });

    describe('successful responses', () => {
      it('handles successful GET responses', async () => {
        const responseData = { user: { id: '123', email: 'test@example.com' } };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: responseData }),
        });

        const result = await apiClient<typeof responseData>('/api/auth/me');

        expect(result.data).toEqual(responseData);
      });

      it('handles successful POST responses', async () => {
        const responseData = { message: 'Created successfully' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: responseData }),
        });

        const result = await apiClient<typeof responseData>('/api/auth/register', {
          method: 'POST',
          body: { email: 'test@example.com', password: 'password123' },
        });

        expect(result.data).toEqual(responseData);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          })
        );
      });

      it('constructs URL with base URL and endpoint', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test/endpoint');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/test/endpoint'),
          expect.any(Object)
        );
      });
    });

    describe('error responses', () => {
      it('parses error responses correctly', async () => {
        const errorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            fields: { email: 'Invalid email format' },
          },
        };
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => errorResponse,
        });

        await expect(apiClient('/api/auth/register')).rejects.toThrow(ApiError);

        try {
          await apiClient('/api/auth/register');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('VALIDATION_ERROR');
          expect(apiError.message).toBe('Validation failed');
          expect(apiError.statusCode).toBe(400);
          expect(apiError.fields).toEqual({ email: 'Invalid email format' });
        }
      });

      it('handles 401 unauthorized errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          }),
        });

        try {
          await apiClient('/api/protected');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('UNAUTHORIZED');
          expect(apiError.statusCode).toBe(401);
        }
      });

      it('handles 403 forbidden errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 403,
          json: async () => ({
            error: {
              code: 'QUOTA_EXCEEDED',
              message: 'You have reached your content limit',
              details: { currentUsage: 3, limit: 3 },
            },
          }),
        });

        try {
          await apiClient('/api/articles/123');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('QUOTA_EXCEEDED');
          expect(apiError.statusCode).toBe(403);
          expect(apiError.details).toEqual({ currentUsage: 3, limit: 3 });
        }
      });

      it('handles 404 not found errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
            },
          }),
        });

        try {
          await apiClient('/api/articles/non-existent');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('NOT_FOUND');
          expect(apiError.statusCode).toBe(404);
        }
      });

      it('handles errors without error details', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({}),
        });

        try {
          await apiClient('/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('UNKNOWN_ERROR');
          expect(apiError.message).toBe('An unknown error occurred');
          expect(apiError.statusCode).toBe(500);
        }
      });
    });

    describe('network errors', () => {
      it('handles network errors', async () => {
        mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

        try {
          await apiClient('/api/test');
        } catch (error) {
          expect(error).toBeInstanceOf(ApiError);
          const apiError = error as ApiError;
          expect(apiError.code).toBe('NETWORK_ERROR');
          expect(apiError.message).toContain('Unable to connect');
          expect(apiError.statusCode).toBe(0);
        }
      });

      it('handles JSON parse errors', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => {
            throw new SyntaxError('Unexpected token');
          },
        });

        await expect(apiClient('/api/test')).rejects.toThrow(ApiError);
      });
    });

    describe('HTTP methods', () => {
      it('defaults to GET method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test');

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'GET',
          })
        );
      });

      it('supports POST method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test', { method: 'POST' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'POST',
          })
        );
      });

      it('supports PUT method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test', { method: 'PUT' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'PUT',
          })
        );
      });

      it('supports DELETE method', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test', { method: 'DELETE' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      it('does not include body for requests without body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: {} }),
        });

        await apiClient('/api/test', { method: 'GET' });

        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.not.objectContaining({
            body: expect.anything(),
          })
        );
      });
    });
  });

  describe('api convenience methods', () => {
    it('api.get calls apiClient with GET method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { result: 'test' } }),
      });

      const result = await api.get<{ result: string }>('/api/test');

      expect(result.data).toEqual({ result: 'test' });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('api.post calls apiClient with POST method and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { created: true } }),
      });

      const result = await api.post<{ created: boolean }>('/api/test', { name: 'Test' });

      expect(result.data).toEqual({ created: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Test' }),
        })
      );
    });

    it('api.put calls apiClient with PUT method and body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { updated: true } }),
      });

      const result = await api.put<{ updated: boolean }>('/api/test', { name: 'Updated' });

      expect(result.data).toEqual({ updated: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ name: 'Updated' }),
        })
      );
    });

    it('api.delete calls apiClient with DELETE method', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { deleted: true } }),
      });

      const result = await api.delete<{ deleted: boolean }>('/api/test');

      expect(result.data).toEqual({ deleted: true });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('ApiError class', () => {
    it('creates error with all properties', () => {
      const error = new ApiError(
        'TEST_ERROR',
        'Test error message',
        400,
        { field: 'error' },
        { extra: 'data' }
      );

      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.fields).toEqual({ field: 'error' });
      expect(error.details).toEqual({ extra: 'data' });
      expect(error.name).toBe('ApiError');
    });

    it('is instanceof Error', () => {
      const error = new ApiError('TEST', 'message', 500);
      expect(error).toBeInstanceOf(Error);
    });
  });
});
