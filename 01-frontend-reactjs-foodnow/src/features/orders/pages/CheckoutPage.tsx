import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useAddresses } from '@/features/auth';
import { ROUTES } from '@/app/routes/routes.config';
import { CartItemRow } from '../components/CartItemRow';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useCartDraftStore } from '../stores/cart.store';
import { calculateCartSubtotal } from '../utils/cart-math';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { data: cart, isLoading: isLoadingCart } = useCart();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const createOrder = useCreateOrder();

  const promotionCodeInput = useCartDraftStore((s) => s.promotionCodeInput);
  const setPromotionCodeInput = useCartDraftStore((s) => s.setPromotionCodeInput);

  const [addressId, setAddressId] = useState<string>('');

  const subtotal = cart ? calculateCartSubtotal(cart.items) : 0;

  const handlePlaceOrder = () => {
    if (!cart?.restaurantId || !addressId) return;
    createOrder.mutate(
      {
        restaurantId: cart.restaurantId,
        deliveryAddressId: addressId,
        promotionCode: promotionCodeInput || undefined,
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          optionIds: item.selectedOptions.map((o) => o.id),
          note: item.note ?? undefined,
        })),
      },
      { onSuccess: (order) => navigate(ROUTES.orderDetail(order.id)) },
    );
  };

  if (isLoadingCart) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <p className="mx-auto max-w-2xl px-6 py-16 text-center text-sm text-muted">Giỏ hàng của bạn đang trống.</p>;
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Thanh toán</h1>

      <section className="mt-6 rounded-ticket border border-muted-border p-4">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onQuantityChange={(quantity) => updateItem.mutate({ id: item.id, payload: { quantity } })}
            onRemove={() => removeItem.mutate(item.id)}
          />
        ))}
      </section>

      <section className="mt-6">
        <h2 className="font-display text-base font-bold text-ink">Giao đến</h2>
        {isLoadingAddresses && <Skeleton className="mt-2 h-10 w-full" />}
        <div className="mt-2 flex flex-col gap-2">
          {addresses?.map((address) => (
            <label
              key={address.id}
              className={`flex cursor-pointer items-center gap-3 rounded-ticket border p-3 ${
                addressId === address.id ? 'border-primary' : 'border-muted-border'
              }`}
            >
              <input type="radio" name="address" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
              <div>
                <p className="text-sm font-medium text-ink">{address.label}</p>
                <p className="text-xs text-muted">{address.streetAddress}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <input
          value={promotionCodeInput}
          onChange={(e) => setPromotionCodeInput(e.target.value)}
          placeholder="Mã khuyến mãi"
          className="w-full rounded-ticket border border-muted-border px-3.5 py-2.5 font-mono text-sm outline-none focus:border-primary"
        />
      </section>

      <div className="mt-6 flex items-center justify-between border-t border-muted-border pt-4">
        <span className="font-mono text-sm text-muted">Tạm tính</span>
        <span className="font-mono text-lg font-bold text-ink">{formatMoney(subtotal)}</span>
      </div>

      <Button onClick={handlePlaceOrder} isLoading={createOrder.isPending} disabled={!addressId} className="mt-6 w-full">
        Đặt hàng
      </Button>
    </div>
  );
}
