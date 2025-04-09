import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext'; // Adjust path if necessary
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authState.authenticated === false) {
      // If not authenticated, redirect to login page
      Alert.alert('Not authenticated', 'You must log in to access this page.');
      router.push('/login');
    } else {
      setLoading(false); // If authenticated, allow access to the page
    }
  }, [authState.authenticated]);

  // Show loading state while checking authentication
  if (loading) {
    return null; // You can show a loading spinner here
  }

  return <>{children}</>;
};

export default AuthGuard;
