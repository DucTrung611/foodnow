import { Badge, Skeleton } from '@/shared/components/ui';
import { useAddresses, useProfile } from '../hooks/useProfile';

export function ProfilePage() {
  const { data: user, isLoading: isLoadingUser } = useProfile();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();

  if (isLoadingUser) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-ink">{user.fullName}</h1>
        <Badge variant={user.role === 'ADMIN' ? 'accent' : 'primary'}>{user.role}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted">
        {user.email} · {user.phone}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg font-bold text-ink">Địa chỉ giao hàng</h2>
        <div className="mt-3 flex flex-col gap-2">
          {isLoadingAddresses && <Skeleton className="h-16 w-full" count={2} />}
          {addresses?.map((address) => (
            <div key={address.id} className="flex items-center justify-between rounded-ticket border border-muted-border p-3">
              <div>
                <p className="text-sm font-medium text-ink">{address.label}</p>
                <p className="text-xs text-muted">{address.streetAddress}</p>
              </div>
              {address.isDefault && <Badge variant="primary">Mặc định</Badge>}
            </div>
          ))}
          {!isLoadingAddresses && addresses?.length === 0 && (
            <p className="text-sm text-muted">Chưa có địa chỉ nào — thêm địa chỉ để đặt hàng nhanh hơn.</p>
          )}
        </div>
      </section>
    </div>
  );
}
