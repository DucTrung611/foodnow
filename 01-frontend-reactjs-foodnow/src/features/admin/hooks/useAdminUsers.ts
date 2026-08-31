import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { adminService } from '../services/admin.service';
import type { AdminUserListParams, UpdateUserStatusPayload } from '../types/admin.types';

export const useAdminUsers = (params: AdminUserListParams = {}) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.listUsers(params),
  });

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusPayload }) => adminService.updateUserStatus(id, payload),
    onSuccess: (_, { payload }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      showToast('success', payload.status === 'SUSPENDED' ? 'Đã khóa tài khoản' : 'Đã cập nhật trạng thái tài khoản');
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể cập nhật trạng thái tài khoản');
    },
  });
};
