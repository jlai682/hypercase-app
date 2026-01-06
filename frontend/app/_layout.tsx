import { Stack } from 'expo-router'
import { AuthProvider } from '../components/auth/AuthContext';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';


export default function Layout(): React.JSX.Element {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </SafeAreaProvider>
    </AuthProvider>
  );
}