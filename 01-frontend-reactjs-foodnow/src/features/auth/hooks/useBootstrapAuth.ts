import { useEffect, useState } from 'react';
import { useAuthStore } from '@/shared/stores/auth.store';
import { authService } from '../services/auth.service';
import { usersService } from '../services/users.service';

/**
 * The access token lives only in memory (API_SPEC.md §2), so a page reload
 * loses it. On mount, silently trade the httpOnly refresh_token cookie for a
 * fresh access token and re-fetch the profile — a 401 just means "guest".
 * Call this once, near the router root, before rendering protected routes.
 */
export function useBootstrapAuth() {
  const [isReady, setIsReady] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    let cancelled = false;

    authService
      .refresh()
      .then(({ accessToken }) => usersService.getMe().then((user) => ({ accessToken, user })))
      .then(({ accessToken, user }) => {
        if (!cancelled) setAuth(user, accessToken);
      })
      .catch(() => {
        // no valid session — stay logged out
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [setAuth]);

  return isReady;
}
