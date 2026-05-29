import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';
import { LoadingSpinner } from '~/components/ui/LoadingSpinner';

export function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
