import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useAddCartItem } from '@/features/orders';
import { ROUTES } from '@/app/routes/routes.config';
import type { MenuItem } from '../types/restaurants.types';
import { MenuItemOptionsModal } from './MenuItemOptionsModal';

type MenuItemRowProps = { item: MenuItem };

export function MenuItemRow({ item }: MenuItemRowProps) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addItem = useAddCartItem();
  const [modalOpen, setModalOpen] = useState(false);
  const hasOptions = item.optionGroups.length > 0;

  const addToCart = (payload: { optionIds: string[]; quantity: number }) => {
    if (!isAuthenticated) {
      navigate(ROUTES.login);
      return;
    }
    addItem.mutate(
      { menuItemId: item.id, quantity: payload.quantity, optionIds: payload.optionIds },
      { onSuccess: () => setModalOpen(false) },
    );
  };

  const handleClick = () => {
    if (hasOptions) {
      setModalOpen(true);
      return;
    }
    addToCart({ optionIds: [], quantity: 1 });
  };

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="size-12 shrink-0 rounded-ticket object-cover"
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm text-ink">{item.name}</span>
            {!item.isAvailable && <Badge variant="neutral">Hết món</Badge>}
          </div>
          <span className="font-mono text-xs text-ink">{formatMoney(item.basePrice)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={!item.isAvailable || (addItem.isPending && !hasOptions)}
        className="shrink-0 rounded-ticket bg-primary px-3.5 py-2 font-sans text-sm font-medium text-paper transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {hasOptions ? 'Tùy chỉnh' : addItem.isPending ? 'Đang thêm…' : 'Thêm'}
      </button>

      {hasOptions && (
        <MenuItemOptionsModal
          item={item}
          open={modalOpen}
          isSubmitting={addItem.isPending}
          onClose={() => setModalOpen(false)}
          onConfirm={addToCart}
        />
      )}
    </div>
  );
}
