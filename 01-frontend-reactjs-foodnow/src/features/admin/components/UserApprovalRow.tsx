import { useState } from 'react';
import { Badge, Button, Modal } from '@/shared/components/ui';
import type { User } from '@/shared/types';
import { useUpdateUserStatus } from '../hooks/useAdminUsers';

const STATUS_VARIANT = {
  PENDING: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
} as const;

export function UserApprovalRow({ user }: { user: User }) {
  const [confirmingSuspend, setConfirmingSuspend] = useState(false);
  const updateStatus = useUpdateUserStatus();

  const suspend = () => {
    updateStatus.mutate({ id: user.id, payload: { status: 'SUSPENDED' } });
    setConfirmingSuspend(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-ticket border border-muted-border p-3">
      <div>
        <p className="text-sm font-medium text-ink">
          {user.fullName} <span className="font-mono text-xs text-muted">· {user.role}</span>
        </p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
        {user.status === 'PENDING' && (
          <Button
            variant="secondary"
            isLoading={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: user.id, payload: { status: 'ACTIVE' } })}
          >
            Duyệt
          </Button>
        )}
        {user.status === 'SUSPENDED' ? (
          <Button
            variant="secondary"
            isLoading={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: user.id, payload: { status: 'ACTIVE' } })}
          >
            Mở khóa
          </Button>
        ) : (
          <Button variant="danger" onClick={() => setConfirmingSuspend(true)}>
            Khóa
          </Button>
        )}
      </div>

      <Modal open={confirmingSuspend} onClose={() => setConfirmingSuspend(false)} title="Khóa tài khoản?">
        <p className="text-sm text-muted">
          Bạn sắp khóa tài khoản của <span className="font-medium text-ink">{user.fullName}</span> ({user.email}). Họ sẽ không thể đăng
          nhập cho đến khi được mở khóa lại.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingSuspend(false)}>
            Hủy
          </Button>
          <Button variant="danger" isLoading={updateStatus.isPending} onClick={suspend}>
            Khóa tài khoản
          </Button>
        </div>
      </Modal>
    </div>
  );
}
