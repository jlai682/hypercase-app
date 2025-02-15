import { Stack } from 'expo-router';

export default function Layout() {
  return (
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
        name="patientSignup"  // Ensure this matches the filename without .js
        options={{
          title: 'Patient Signup',
          headerStyle: {
            backgroundColor: '#4A90E2',
          },
          headerTintColor: '#fff',
        }}
      />
    </Stack>
  );
}
