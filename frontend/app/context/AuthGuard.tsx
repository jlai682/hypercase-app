import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext'; // Adjust the path if needed
import { useRouter } from 'expo-router'; // Adjust for your routing library

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { authState } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (authState.authenticated === null) {
        // If auth state is still loading, wait
        return;
      }

      if (!authState.authenticated) {
        // Redirect to login if not authenticated
        console.log('Redirecting to login...');
        router.push('/login');  // Ensure this matches the correct route in your routing structure
      } else {
        // Once authenticated, stop loading
        setLoading(false);
      }
    };

    checkAuth();
  }, [authState.authenticated, router]);

  if (loading) {
    return;  // Or your preferred loading spinner
  }

  return <>{children}</>;
};

export default AuthGuard;
