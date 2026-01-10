/**
 * API Client
 *
 * Fetch wrapper for communicating with the backend API.
 * Handles credentials (cookies), error parsing, and typed responses.
 */

import { type ApiResponse } from '@astronacci/shared';

/**
 * Base URL for API requests.
 * Uses environment variable or defaults to localhost.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * API client error with parsed error details.
 */
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public fields?: Record<string, string>,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Request options for API calls.
 */
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Make an API request with credentials and error handling.
 *
 * @param endpoint - API endpoint path (e.g., '/api/auth/me')
 * @param options - Request options (method, body, headers)
 * @returns The response data
 * @throws ApiError if the request fails
 *
 * @example
 * const { data } = await apiClient<{ user: User }>('/api/auth/me');
 *
 * @example
 * const { data } = await apiClient<{ user: User }>('/api/auth/login', {
 *   method: 'POST',
 *   body: { email: 'user@example.com', password: 'password' },
 * });
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, headers = {} } = options;

  const url = `${API_BASE_URL}${endpoint}`;

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include', // Include cookies for session auth
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, fetchOptions);
    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      const error = json.error;
      throw new ApiError(
        error?.code || 'UNKNOWN_ERROR',
        error?.message || 'An unknown error occurred',
        response.status,
        error?.fields,
        error?.details
      );
    }

    return json;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    throw new ApiError(
      'NETWORK_ERROR',
      'Unable to connect to the server. Please check your internet connection.',
      0
    );
  }
}

/**
 * Convenience methods for common HTTP methods.
 */
export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'GET' }),

  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: 'POST', body }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, { method: 'PUT', body }),

  delete: <T>(endpoint: string) => apiClient<T>(endpoint, { method: 'DELETE' }),
};

export default api;
