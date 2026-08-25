import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from '../utils/order-status';
import type { OrderStatus } from '../types/orders.types';

type OrderStatusTimelineProps = {
  status: OrderStatus;
};

export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === 'CANCELLED') {
    return <p className="font-mono text-sm text-danger">Đơn hàng đã bị hủy</p>;
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <ol className="flex items-center">
      {ORDER_STATUS_SEQUENCE.map((step, i) => (
        <li key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${i <= currentIndex ? 'bg-primary' : 'bg-muted-border'}`} />
            <span className={`font-mono text-[10px] ${i <= currentIndex ? 'text-ink' : 'text-muted'}`}>
              {ORDER_STATUS_LABELS[step]}
            </span>
          </div>
          {i < ORDER_STATUS_SEQUENCE.length - 1 && (
            <span className={`mx-1 h-px flex-1 ${i < currentIndex ? 'bg-primary' : 'bg-muted-border'}`} />
          )}
        </li>
      ))}
    </ol>
  );
}
