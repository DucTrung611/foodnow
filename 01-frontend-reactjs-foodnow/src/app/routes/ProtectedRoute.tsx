import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { Role } from '@/shared/types';
import { ROUTES } from './routes.config';

type ProtectedRouteProps = {
  roles?: Role[];
  children: ReactNode;
};

export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return children;
}
