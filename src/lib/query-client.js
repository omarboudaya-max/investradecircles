/**
 * Smart Caching — Centralized React Query configuration.
 * Defines stale times and cache times per query type via meta tags.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: data is fresh for 2 minutes, cached for 10 minutes
      staleTime: 2 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Predefined cache profiles — use via queryKey metadata or manually set staleTime.
 *
 * Usage example:
 *   useQuery({ queryKey: ['posts'], queryFn: ..., staleTime: CACHE.realtime })
 */
export const CACHE = {
  realtime: 0,             // Always fresh (e.g. notifications, messages)
  short: 30 * 1000,        // 30 seconds (e.g. feed, leaderboard)
  medium: 2 * 60 * 1000,  // 2 minutes (default — general data)
  long: 10 * 60 * 1000,   // 10 minutes (e.g. user profiles, circles)
  permanent: Infinity,     // Never re-fetch (e.g. static config)
};