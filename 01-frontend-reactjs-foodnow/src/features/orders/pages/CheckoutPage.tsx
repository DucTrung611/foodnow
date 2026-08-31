import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useAddresses } from '@/features/auth';
import { ROUTES } from '@/app/routes/routes.config';
import { CartItemRow } from '../components/CartItemRow';
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../hooks/useCart';
import { useCreateOrder } from '../hooks/useCreateOrder';
import { useOrderQuote } from '../hooks/useOrderQuote';
import { useCartDraftStore } from '../stores/cart.store';
import { calculateCartSubtotal } from '../utils/cart-math';
import type { CreateOrderPayload } from '../types/orders.types';

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
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  // Pre-select the default (or only) address instead of leaving "Đặt hàng"
  // disabled until the user re-picks the one address they already have.
  useEffect(() => {
    if (addressId || !addresses || addresses.length === 0) return;
    setAddressId(addresses.find((a) => a.isDefault)?.id ?? addresses[0].id);
  }, [addresses, addressId]);

  const subtotal = cart ? calculateCartSubtotal(cart.items) : 0;

  const orderPayload: CreateOrderPayload | null =
    cart?.restaurantId && addressId
      ? {
          restaurantId: cart.restaurantId,
          deliveryAddressId: addressId,
          promotionCode: promotionCodeInput || undefined,
          items: cart.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            optionIds: item.selectedOptions.map((o) => o.id),
            note: item.note ?? undefined,
          })),
        }
      : null;
  const { data: quote, isFetching: isQuoting } = useOrderQuote(orderPayload);

  const handlePlaceOrder = () => {
    if (!orderPayload) return;
    setConfirmingOrder(false);
    createOrder.mutate(orderPayload, {
      onSuccess: (order) => navigate(ROUTES.orderDetail(order.id)),
    });
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

      <div className="mt-6 flex flex-col gap-1.5 border-t border-muted-border pt-4">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted">Tạm tính</span>
          <span className="font-mono text-sm text-ink">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-muted">Phí giao hàng</span>
          <span className="font-mono text-sm text-ink">{quote ? formatMoney(quote.deliveryFee) : isQuoting ? '…' : '—'}</span>
        </div>
        {quote && Number(quote.discountAmount) > 0 && (
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm text-muted">Giảm giá</span>
            <span className="font-mono text-sm text-success">−{formatMoney(quote.discountAmount)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-muted-border pt-2">
          <span className="font-mono text-sm font-medium text-ink">Tổng cộng</span>
          <span className="font-mono text-lg font-bold text-ink">
            {quote ? formatMoney(quote.totalAmount) : isQuoting ? '…' : formatMoney(subtotal)}
          </span>
        </div>
      </div>

      <Button
        onClick={() => setConfirmingOrder(true)}
        isLoading={createOrder.isPending}
        disabled={!addressId || isQuoting}
        className="mt-6 w-full"
      >
        Đặt hàng
      </Button>

      <Modal open={confirmingOrder} onClose={() => setConfirmingOrder(false)} title="Xác nhận đặt hàng">
        <p className="text-sm text-muted">
          Bạn sắp đặt đơn hàng với tổng giá trị{' '}
          <span className="font-mono font-bold text-ink">{quote ? formatMoney(quote.totalAmount) : formatMoney(subtotal)}</span>.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmingOrder(false)}>
            Hủy
          </Button>
          <Button onClick={handlePlaceOrder} isLoading={createOrder.isPending}>
            Xác nhận đặt hàng
          </Button>
        </div>
      </Modal>
    </div>
  );
}
