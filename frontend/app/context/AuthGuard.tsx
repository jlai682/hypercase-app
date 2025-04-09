import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext'; // Adjust the path if needed
import { useRouter } from 'expo-router'; // Adjust for your routing library

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authState.authenticated) {
      // If not authenticated, redirect to login page
      router.push('/login');
    } else {
      setLoading(false); // If authenticated, allow access to the page
    }
  }, [authState.authenticated, router]);

  if (loading) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
};

export default AuthGuard;
