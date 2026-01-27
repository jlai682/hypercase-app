import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,        // Data considered fresh for 30 seconds
      gcTime: 5 * 60 * 1000,   // Cache retained for 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
