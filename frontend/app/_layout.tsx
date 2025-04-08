import { Stack } from 'expo-router';
import { AuthProvider } from './context/AuthContext';  // Adjust the import path if needed

export default function Layout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false, // 👈 This hides headers globally
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="patientDash"
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
        <Stack.Screen
          name="selectQuestions"
          options={{
            title: 'Select Survey Questions',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="finalizeSurvey"
          options={{
            title: 'Finalize Survey',
            headerShown: false,
            headerTintColor: '#fff',
          }}
        />
        <Stack.Screen
          name="surveyResponder"
          options={{
            title: 'Survey Responder',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="previousSurvey"
          options={{
            title: 'Survey Responder',
            headerShown: false,
          }}
        />

      </Stack>
    </AuthProvider>
  );
}
