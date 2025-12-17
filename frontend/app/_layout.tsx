import { Stack } from 'expo-router';
import { AuthProvider } from '../components/auth/AuthContext';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const HEADER_STYLE = {
  backgroundColor: '#4A90E2',
};

const HEADER_TINT_COLOR = '#fff';

export default function Layout(): React.JSX.Element {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen
            name="consent"
            options={{
              title: 'Consent Form',
              headerStyle: HEADER_STYLE,
              headerTintColor: HEADER_TINT_COLOR,
            }}
          />
          <Stack.Screen
            name="recordings"
            options={{
              title: 'Recordings',
              headerStyle: HEADER_STYLE,
              headerTintColor: HEADER_TINT_COLOR,
            }}
          />
          <Stack.Screen
            name="record"
            options={{
              title: 'Voice Recording',
              headerStyle: HEADER_STYLE,
              headerTintColor: HEADER_TINT_COLOR,
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}