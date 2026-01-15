import { Stack } from 'expo-router'
import { AuthProvider } from '../components/auth/AuthContext';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Export queryClient so it can be used for cache clearing on logout
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

export default function Layout(): React.JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SafeAreaProvider>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </SafeAreaProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}