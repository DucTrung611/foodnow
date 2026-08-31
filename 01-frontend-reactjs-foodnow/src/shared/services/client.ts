import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError, type ApiErrorBody, type ApiResponse, type PaginatedResult, type User } from '@/shared/types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh_token cookie
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh: concurrent 401s queue behind one /auth/refresh call.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<{ accessToken: string; user: User }>>(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      .then((res) => {
        const { accessToken, user } = res.data.data;

        // refresh_token lives in a browser-wide httpOnly cookie, not a
        // per-tab one — if another tab logged in as a different account,
        // it silently overwrote that cookie too. Without this check, this
        // tab would keep showing the *old* user's name in the header while
        // every subsequent request actually ran as the *new* user's token
        // (UX-AUDIT-REPORT.md §0 "shared refresh token"). Force a clean
        // logout here instead of continuing with a mismatched identity.
        const currentUser = useAuthStore.getState().user;
        if (currentUser && currentUser.id !== user.id) {
          useAuthStore.getState().clearAuth();
          useNotificationStore
            .getState()
            .showToast('error', 'Phiên đăng nhập đã thay đổi ở một tab khác. Vui lòng đăng nhập lại.');
          throw new Error('Session identity changed in another tab');
        }

        useAuthStore.getState().setAuth(user, accessToken);
        return accessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (AxiosRequestConfig & { _retried?: boolean }) | undefined;
    const body = error.response?.data;

    if (error.response?.status === 401 && body?.error.code === 'AUTH_1001' && original && !original._retried) {
      original._retried = true;
      try {
        const token = await refreshAccessToken();
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return apiClient.request(original);
      } catch {
        useAuthStore.getState().clearAuth();
        return Promise.reject(new ApiError(401, 'AUTH_1001', 'Phiên đăng nhập đã hết hạn'));
      }
    }

    if (body?.error) {
      return Promise.reject(new ApiError(error.response!.status, body.error.code, body.error.message, body.error.details));
    }

    return Promise.reject(error);
  },
);

/** Unwraps the `{ success, data }` envelope — services call this, never raw axios. */
export async function unwrap<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

/**
 * Unwraps a list endpoint's envelope into `{ items, meta }`. `meta` sits
 * alongside `data` at the envelope's top level (API_SPEC.md §4), not nested
 * inside it — `data` on a list response is just the bare array — so this
 * can't reuse `unwrap`, which only returns `data`.
 */
export async function unwrapPaginated<T>(promise: Promise<{ data: ApiResponse<T[]> }>): Promise<PaginatedResult<T>> {
  const res = await promise;
  return { items: res.data.data, meta: res.data.meta! };
}
