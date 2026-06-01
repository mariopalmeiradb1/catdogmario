import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

interface PrivateRouteProps {
  skipPasswordCheck?: boolean;
}

export function PrivateRoute({ skipPasswordCheck = false }: PrivateRouteProps) {
  const { isAuthenticated, isLoading, mustChangePassword } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword && !skipPasswordCheck) {
    return <Navigate to="/change-password" replace />;
  }

  return <Outlet />;
}
