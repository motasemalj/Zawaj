import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNav from './src/navigation';

// NOTE: I18nManager.forceRTL() does NOT work reliably in Expo Go on iOS
// Instead, we use explicit RTL styling in all components:
// - flexDirection: 'row-reverse' for horizontal layouts
// - textAlign: 'right' for text
// - writingDirection: 'rtl' for text inputs and complex text

const client = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // Data stays fresh for 30 seconds
      refetchOnWindowFocus: true, // Refetch when app comes to foreground
      refetchOnReconnect: true, // Refetch when internet reconnects
      retry: 1, // Retry failed requests once
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={client}>
        <RootNav />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
