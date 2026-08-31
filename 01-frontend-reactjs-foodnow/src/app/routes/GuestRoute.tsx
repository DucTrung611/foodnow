import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { HOME_ROUTE_BY_ROLE } from './routes.config';

/**
 * Keeps an already-authenticated user off /login and /register instead of
 * rendering the form on top of a logged-in header — and is the *only* place
 * that redirects after a fresh login (see `useLogin`'s comment): it fires
 * the instant `isAuthenticated` flips true, before an imperative
 * `navigate()` in the login mutation's `onSuccess` would even run, so a
 * second redirect there was a dead line that occasionally raced this one to
 * the wrong destination (`ROUTES.home` for every role instead of each
 * role's own dashboard).
 */
export function GuestRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (isAuthenticated && role) {
    return <Navigate to={HOME_ROUTE_BY_ROLE[role]} replace />;
  }

  return children;
}
