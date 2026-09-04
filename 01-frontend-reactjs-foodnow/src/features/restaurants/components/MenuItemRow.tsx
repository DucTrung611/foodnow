import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Button, FallbackImage } from '@/shared/components/ui';
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
        {item.imageUrl && <FallbackImage src={item.imageUrl} alt={item.name} className="size-14 shrink-0 rounded-card" />}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-body text-ink">{item.name}</span>
            {!item.isAvailable && <Badge variant="neutral">Hết món</Badge>}
          </div>
          <span className="text-body-sm text-ink">{formatMoney(item.basePrice)}</span>
        </div>
      </div>

      {/* "Tùy chỉnh" opens a modal (nothing happens yet) — ghost, so it reads
          as a lighter-weight step than "Thêm", which mutates the cart immediately. */}
      <Button
        variant={hasOptions ? 'ghost' : 'primary'}
        size="sm"
        onClick={handleClick}
        disabled={!item.isAvailable || (addItem.isPending && !hasOptions)}
        isLoading={addItem.isPending && !hasOptions}
        className="shrink-0"
      >
        {hasOptions ? 'Tùy chỉnh' : 'Thêm'}
      </Button>

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
