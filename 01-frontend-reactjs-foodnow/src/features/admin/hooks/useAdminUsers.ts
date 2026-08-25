import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { AdminUserListParams, UpdateUserStatusPayload } from '../types/admin.types';

export const useAdminUsers = (params: AdminUserListParams = {}) =>
  useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminService.listUsers(params),
  });

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserStatusPayload }) => adminService.updateUserStatus(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};
