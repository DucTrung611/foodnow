/**
 * Generic tone -> pill renderer (G9: one status badge implementation, not
 * four different visual treatments per role). Deliberately takes a `tone` +
 * `label` pair instead of importing the orders feature's `OrderStatus` type,
 * so this stays a presentational shared primitive — the orders feature maps
 * its own enum to a tone (see features/orders/utils/order-status.ts).
 */
export type StatusTone = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'enroute' | 'delivered' | 'cancelled';

type StatusBadgeProps = {
  tone: StatusTone;
  label: string;
};

const TONE_CLASSES: Record<StatusTone, string> = {
  pending: 'bg-status-pending/15 text-status-pending',
  confirmed: 'bg-status-confirmed/15 text-status-confirmed',
  preparing: 'bg-status-preparing/15 text-status-preparing',
  ready: 'bg-status-ready/15 text-status-ready',
  enroute: 'bg-status-enroute/15 text-status-enroute',
  delivered: 'bg-status-delivered/15 text-status-delivered',
  cancelled: 'bg-status-cancelled/15 text-status-cancelled',
};

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-caption ${TONE_CLASSES[tone]}`}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}
