import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';  // Adjust the import path if needed

export default function Layout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen 
          name="index" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="home" 
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="consent" 
          options={{
            title: 'Consent Form',
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="record" 
          options={{
            title: 'Voice Recording',
            headerStyle: {
              backgroundColor: '#4A90E2',
            },
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="signup"  
          options={{
            title: 'Signup',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="login"  
          options={{
            title: 'Patient Login',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="providerDash" 
          options={{
            title: 'Provider Dashboard',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen 
          name="patientProfile" 
          options={{
            title: 'Patient Profile',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />

      </Stack>
    </AuthProvider>
  );
}
