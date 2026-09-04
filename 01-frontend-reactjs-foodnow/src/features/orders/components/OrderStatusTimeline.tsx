import { Fragment } from 'react';
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE } from '../utils/order-status';
import type { OrderStatus } from '../types/orders.types';

type OrderStatusTimelineProps = {
  status: OrderStatus;
};

/**
 * Vertical stepper on mobile, horizontal (wrapping) on desktop — the
 * original single fixed-width horizontal row overlapped its own labels once
 * Vietnamese status text ("Chờ tài xế lấy") didn't fit 6-across (design brief).
 * Connectors are real flex siblings between steps, not absolutely-positioned
 * pseudo-lines, so they can't drift when the row wraps.
 */
export function OrderStatusTimeline({ status }: OrderStatusTimelineProps) {
  if (status === 'CANCELLED') {
    return (
      <p className="flex items-center gap-2 text-body-sm font-medium text-danger">
        <span className="size-2.5 rounded-full bg-danger" aria-hidden />
        Đơn hàng đã bị hủy
      </p>
    );
  }

  const currentIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <ol className="flex flex-col sm:flex-row sm:flex-wrap sm:items-start">
      {ORDER_STATUS_SEQUENCE.map((step, i) => {
        const isDone = i <= currentIndex;
        const isLast = i === ORDER_STATUS_SEQUENCE.length - 1;
        return (
          <Fragment key={step}>
            <li className="flex items-start gap-3 sm:w-24 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
              <span
                className={`mt-0.5 size-3 shrink-0 rounded-full sm:mt-0 ${
                  isDone ? 'bg-primary' : 'border-2 border-muted-border bg-paper'
                }`}
                aria-hidden
              />
              <span className={`text-body-sm ${isDone ? 'font-medium text-ink' : 'text-muted'}`}>
                {ORDER_STATUS_LABELS[step]}
              </span>
            </li>
            {!isLast && (
              <li
                aria-hidden
                className={`ml-[5px] h-4 w-px sm:ml-0 sm:mt-[7px] sm:h-px sm:min-w-6 sm:flex-1 ${
                  i < currentIndex ? 'bg-primary' : 'bg-muted-border'
                }`}
              />
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
