import { http, HttpResponse } from 'msw';

const BASE_URL = 'http://localhost:3000/api/v1';

/**
 * Baseline handlers so the app shell doesn't error in every test (e.g.
 * useBootstrapAuth's silent refresh on mount). Individual tests override
 * these with `server.use(...)` for the behavior they actually want to
 * exercise — see features/auth/hooks/useAuth.test.tsx for an example.
 */
export const handlers = [
  http.post(`${BASE_URL}/auth/refresh`, () => HttpResponse.json({ success: false }, { status: 401 })),
];
