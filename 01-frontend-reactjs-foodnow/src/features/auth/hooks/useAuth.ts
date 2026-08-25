import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { ROUTES } from '@/app/routes/routes.config';
import { authService } from '../services/auth.service';
import type { LoginPayload, RegisterPayload } from '../types/auth.types';

export const useLogin = () => {
  const setAuth = useAuthStore((s) => s.setAuth);
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: ({ user, accessToken }) => {
      setAuth(user, accessToken);
      navigate(ROUTES.home);
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Đăng nhập thất bại');
    },
  });
};

export const useRegister = () => {
  const showToast = useNotificationStore((s) => s.showToast);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: () => {
      showToast('success', 'Tạo tài khoản thành công, vui lòng đăng nhập');
      navigate(ROUTES.login);
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Đăng ký thất bại');
    },
  });
};

export const useLogout = () => {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      clearAuth();
      navigate(ROUTES.home);
    },
  });
};
