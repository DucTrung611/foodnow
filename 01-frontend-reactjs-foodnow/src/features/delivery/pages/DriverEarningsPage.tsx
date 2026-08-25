import { Badge, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatDateTime } from '@/shared/utils/date';
import { useDriverEarnings } from '../hooks/useDriverEarnings';

export function DriverEarningsPage() {
  const { data, isLoading } = useDriverEarnings();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10 text-paper">
      <h1 className="font-display text-2xl font-bold">Thu nhập</h1>

      <div className="mt-6 flex gap-4">
        <div className="flex-1 rounded-ticket bg-paper/5 p-4">
          <p className="font-mono text-xs text-paper/60">Tổng thu nhập</p>
          <p className="mt-1 font-mono text-xl font-bold">{formatMoney(data.totalEarned)}</p>
        </div>
        <div className="flex-1 rounded-ticket bg-paper/5 p-4">
          <p className="font-mono text-xs text-paper/60">Chờ thanh toán</p>
          <p className="mt-1 font-mono text-xl font-bold">{formatMoney(data.pendingPayout)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col divide-y divide-paper/10">
        {data.entries.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between py-3">
            <span className="font-mono text-xs text-paper/60">{formatDateTime(entry.createdAt)}</span>
            <span className="font-mono text-sm">{formatMoney(entry.amount)}</span>
            <Badge variant={entry.status === 'PAID' ? 'success' : 'neutral'}>{entry.status}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
