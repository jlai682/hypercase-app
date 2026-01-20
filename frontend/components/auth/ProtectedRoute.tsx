import React from 'react';
import { useAuth } from '../auth/AuthContext';
import LoggedOutView from '../LoggedOutView'
import { ProtectedRouteProps } from '@/types';

export default function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated()) {
    return <LoggedOutView />;
  }

  return <>{children}</>;
}
