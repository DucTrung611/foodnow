import { Skeleton } from '@/shared/components/ui';
import { UserApprovalRow } from '../components/UserApprovalRow';
import { useAdminUsers } from '../hooks/useAdminUsers';

export function AdminUsersPage() {
  const { data, isLoading } = useAdminUsers();

  return (
    <div className="px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Người dùng</h1>

      <div className="mt-6 flex flex-col gap-2">
        {isLoading && <Skeleton className="h-16 w-full" count={4} />}
        {data?.items.map((user) => (
          <UserApprovalRow key={user.id} user={user} />
        ))}
      </div>
    </div>
  );
}
