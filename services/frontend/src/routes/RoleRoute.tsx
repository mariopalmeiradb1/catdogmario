import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '~/hooks/useAuth';

interface RoleRouteProps {
  allowedRoles: string[];
}

const roleHomeMap: Record<string, string> = {
  adopter: '/catalog',
  ong_volunteer: '/ong/dashboard',
  ong_admin: '/ong/dashboard',
  system_admin: '/admin/ongs',
};

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    const homePath = roleHomeMap[user.role] || '/login';
    return <Navigate to={homePath} replace />;
  }

  return <Outlet />;
}
