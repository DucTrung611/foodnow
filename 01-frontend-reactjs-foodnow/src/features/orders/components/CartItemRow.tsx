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
        <p className="truncate text-sm font-medium text-ink">{item.name}</p>
        {item.selectedOptions.length > 0 && (
          <p className="truncate text-xs text-muted">{item.selectedOptions.map((o) => o.name).join(', ')}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQuantityChange(Math.max(1, item.quantity - 1))}
          className="size-7 rounded-ticket border border-muted-border text-ink hover:bg-primary-bg"
          aria-label="Giảm số lượng"
        >
          −
        </button>
        <span className="w-5 text-center font-mono text-sm text-ink">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onQuantityChange(item.quantity + 1)}
          className="size-7 rounded-ticket border border-muted-border text-ink hover:bg-primary-bg"
          aria-label="Tăng số lượng"
        >
          +
        </button>
      </div>

      <span className="w-24 text-right font-mono text-sm text-ink">{formatMoney(item.basePrice)}</span>

      <button type="button" onClick={onRemove} className="text-muted hover:text-danger" aria-label="Xóa món">
        ×
      </button>
    </div>
  );
}
