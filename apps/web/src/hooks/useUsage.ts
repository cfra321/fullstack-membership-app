/**
 * useUsage Hook
 *
 * Fetches and provides usage statistics for the current user.
 */

import { useState, useEffect, useCallback } from 'react';

import { api } from '../lib/api';

/**
 * Usage statistics for a content type.
 */
interface ContentUsage {
  /** IDs of accessed content items */
  accessed: string[];
  /** Number of items accessed */
  count: number;
  /** Maximum allowed items (Infinity for unlimited) */
  limit: number;
  /** Remaining items that can be accessed */
  remaining: number;
}

/**
 * Full usage statistics.
 */
export interface UsageStats {
  articles: ContentUsage;
  videos: ContentUsage;
}

/**
 * Return value for the useUsage hook.
 */
export interface UseUsageResult {
  /** Usage statistics, or null if not loaded */
  usage: UsageStats | null;
  /** Whether the usage data is being loaded */
  isLoading: boolean;
  /** Error message, or null if no error */
  error: string | null;
  /** Function to refetch usage data */
  refetch: () => Promise<void>;
}

/**
 * useUsage Hook
 *
 * Fetches usage statistics from the API and provides state management.
 *
 * @returns Usage statistics state and methods
 *
 * @example
 * function Dashboard() {
 *   const { usage, isLoading, error, refetch } = useUsage();
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return (
 *     <div>
 *       <p>Articles: {usage.articles.count}/{usage.articles.limit}</p>
 *       <p>Videos: {usage.videos.count}/{usage.videos.limit}</p>
 *     </div>
 *   );
 * }
 */
export function useUsage(): UseUsageResult {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch usage data from the API.
   */
  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<UsageStats>('/api/user/usage');
      setUsage(response.data ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch usage data';
      setError(message);
      setUsage(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Refetch usage data.
   */
  const refetch = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  // Fetch usage on mount
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    usage,
    isLoading,
    error,
    refetch,
  };
}

export default useUsage;
