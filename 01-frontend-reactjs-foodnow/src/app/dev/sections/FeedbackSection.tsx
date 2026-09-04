import { useState } from 'react';
import { Skeleton, EmptyState, ErrorState, Spinner, Button } from '@/shared/components/ui';

export function FeedbackSection() {
  const [retries, setRetries] = useState(0);

  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-display-md text-ink">Skeleton, EmptyState, ErrorState, Spinner</h2>

      <div>
        <p className="mb-2 text-body-sm text-muted">Skeleton (loading)</p>
        <div className="flex max-w-sm flex-col gap-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>

      <div className="rounded-card border border-muted-border">
        <EmptyState
          title="Chưa có đơn hàng nào"
          description="Các đơn bạn đặt sẽ xuất hiện ở đây."
          action={<Button size="sm">Khám phá nhà hàng</Button>}
        />
      </div>

      <div className="rounded-card border border-muted-border">
        <ErrorState
          title="Không tải được dữ liệu"
          description="Kiểm tra kết nối mạng và thử lại."
          onRetry={() => setRetries((r) => r + 1)}
        />
        <p className="pb-3 text-center text-caption text-muted">Đã bấm thử lại: {retries} lần</p>
      </div>

      <div className="flex items-center gap-4 text-primary">
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
        <Spinner size="md" label="Đang tải trang" />
      </div>
    </section>
  );
}
