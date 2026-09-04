import { formatMoney } from '@/shared/utils/money';
import type { CartItem } from '../types/orders.types';

type CartItemRowProps = {
  item: CartItem;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-muted-border py-3 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-ink">{item.name}</p>
        {item.selectedOptions.length > 0 && (
          <p className="truncate text-body-sm text-muted">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
          className="flex size-11 items-center justify-center rounded-ticket border border-muted-border text-ink hover:bg-primary-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label="Giảm số lượng"
        >
          −
        </button>
        <span className="w-6 text-center text-body text-ink">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="flex size-11 items-center justify-center rounded-ticket border border-muted-border text-ink hover:bg-primary-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>

      <span className="w-24 text-right text-body-sm text-ink">{formatMoney(item.basePrice)}</span>

      <button
        type="button"
        onClick={onRemove}
        className="flex size-11 items-center justify-center rounded-full text-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="Xóa món"
      >
        <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
