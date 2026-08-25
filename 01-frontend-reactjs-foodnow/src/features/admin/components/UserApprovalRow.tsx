import { Badge, Button } from '@/shared/components/ui';
import type { User } from '@/shared/types';
import { useUpdateUserStatus } from '../hooks/useAdminUsers';

const STATUS_VARIANT = {
  PENDING: 'neutral',
  ACTIVE: 'success',
  SUSPENDED: 'danger',
} as const;

export function UserApprovalRow({ user }: { user: User }) {
  const updateStatus = useUpdateUserStatus();

  return (
    <div className="flex items-center justify-between gap-4 rounded-ticket border border-muted-border p-3">
      <div>
        <p className="text-sm font-medium text-ink">
          {user.fullName} <span className="font-mono text-xs text-muted">· {user.role}</span>
        </p>
        <p className="text-xs text-muted">{user.email}</p>
      </div>

      <div className="flex items-center gap-2">
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
        {user.status !== 'SUSPENDED' && (
          <Button
            variant="danger"
            isLoading={updateStatus.isPending}
            onClick={() => updateStatus.mutate({ id: user.id, payload: { status: 'SUSPENDED' } })}
          >
            Khóa
          </Button>
        )}
      </div>
    </div>
  );
}
