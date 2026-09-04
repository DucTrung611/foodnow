import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Modal, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useAddresses } from '@/features/auth';
import { useRestaurant } from '@/features/restaurants';
import { PromoCodeInput } from '@/features/promotions';
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
  const { data: cart, isLoading: isLoadingCart, isError: isCartError, refetch: refetchCart } = useCart();
  const { data: addresses, isLoading: isLoadingAddresses } = useAddresses();
  const { data: restaurant } = useRestaurant(cart?.restaurantId ?? '');
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const createOrder = useCreateOrder();

  const promotionCodeInput = useCartDraftStore((s) => s.promotionCodeInput);
  const setPromotionCodeInput = useCartDraftStore((s) => s.setPromotionCodeInput);

  const [addressId, setAddressId] = useState('');
  const [note, setNote] = useState('');
  const [confirmingOrder, setConfirmingOrder] = useState(false);

  // Derived during render, not an effect: the default address only needs to
  // be picked once `addresses` has loaded — there's no external system to
  // synchronize with, just a fallback for a value the user hasn't chosen yet.
  const selectedAddressId = addressId || addresses?.find((a) => a.isDefault)?.id || addresses?.[0]?.id || '';

  const subtotal = cart ? calculateCartSubtotal(cart.items) : 0;

  const orderPayload: CreateOrderPayload | null =
    cart?.restaurantId && selectedAddressId
      ? {
          restaurantId: cart.restaurantId,
          deliveryAddressId: selectedAddressId,
          promotionCode: promotionCodeInput || undefined,
          note: note || undefined,
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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    );
  }

  if (isCartError) {
    return <ErrorState title="Không tải được giỏ hàng" onRetry={() => refetchCart()} />;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <EmptyState
        title="Giỏ hàng của bạn đang trống"
        description="Khám phá nhà hàng và thêm món để bắt đầu đặt hàng."
        action={
          <Button size="sm" onClick={() => navigate(ROUTES.restaurants)}>
            Khám phá nhà hàng
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10">
      <h1 className="font-display text-display-lg text-ink">Thanh toán</h1>
      {restaurant && <p className="mt-1 text-body-sm text-muted">{restaurant.name}</p>}

      <Card className="mt-6">
        {cart.items.map((item) => (
          <CartItemRow
            key={item.id}
            item={item}
            onQuantityChange={(quantity) => updateItem.mutate({ id: item.id, payload: { quantity } })}
            onRemove={() => removeItem.mutate(item.id)}
          />
        ))}
      </Card>

      <section className="mt-6">
        <h2 className="font-display text-display-md text-ink">Giao đến</h2>
        {isLoadingAddresses && <Skeleton className="mt-2 h-11 w-full" />}
        {!isLoadingAddresses && addresses?.length === 0 && (
          <p className="mt-2 text-body-sm text-muted">
            Bạn chưa có địa chỉ giao hàng.{' '}
            <Link to={ROUTES.profile} className="font-medium text-primary hover:text-primary-hover">
              Thêm địa chỉ
            </Link>
          </p>
        )}
        <div className="mt-2 flex flex-col gap-2">
          {addresses?.map((address) => (
            <label
              key={address.id}
              className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-ticket border p-3 ${
                selectedAddressId === address.id ? 'border-primary' : 'border-muted-border'
              }`}
            >
              <input
                type="radio"
                name="address"
                className="size-4 accent-primary"
                checked={selectedAddressId === address.id}
                onChange={() => setAddressId(address.id)}
              />
              <div>
                <p className="text-body font-medium text-ink">{address.label}</p>
                <p className="text-body-sm text-muted">{address.streetAddress}</p>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <label htmlFor="delivery-note" className="text-body-sm font-medium text-ink">
          Ghi chú cho tài xế
        </label>
        <textarea
          id="delivery-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: Gọi điện khi tới nơi"
          rows={2}
          className="mt-1.5 w-full resize-none rounded-ticket border border-muted-border px-3.5 py-2.5 font-sans text-body text-ink outline-none transition-colors placeholder:text-muted focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        />
      </section>

      {cart.restaurantId && (
        <section className="mt-6">
          <h2 className="mb-2 font-display text-display-md text-ink">Mã khuyến mãi</h2>
          <PromoCodeInput
            restaurantId={cart.restaurantId}
            subtotal={String(subtotal)}
            onApplied={(code) => setPromotionCodeInput(code)}
          />
        </section>
      )}

      <Card variant="ticket" className="mt-6 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-muted">Tạm tính</span>
          <span className="text-ink">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-muted">Phí giao hàng</span>
          <span className="text-ink">{quote ? formatMoney(quote.deliveryFee) : isQuoting ? 'Đang tính…' : '—'}</span>
        </div>
        {quote && Number(quote.discountAmount) > 0 && (
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-muted">Giảm giá</span>
            <span className="text-success">-{formatMoney(quote.discountAmount)}</span>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-muted-border pt-2">
          <span className="text-body font-medium text-ink">Tổng cộng</span>
          <span className="text-body-lg font-bold text-ink">
            {quote ? formatMoney(quote.totalAmount) : isQuoting ? 'Đang tính…' : formatMoney(subtotal)}
          </span>
        </div>
      </Card>

      <p className="mt-3 text-body-sm text-muted">
        Bạn sẽ chọn phương thức thanh toán ở bước tiếp theo, ngay sau khi đặt hàng thành công.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-muted-border bg-paper px-4 py-3 shadow-float sm:px-6">
        <Button
          onClick={() => setConfirmingOrder(true)}
          isLoading={createOrder.isPending}
          disabled={!selectedAddressId || isQuoting}
          className="mx-auto w-full max-w-2xl"
        >
          Đặt hàng
        </Button>
      </div>

      <Modal open={confirmingOrder} onClose={() => setConfirmingOrder(false)} title="Xác nhận đặt hàng">
        <p className="text-body text-ink">
          Bạn sắp đặt đơn hàng với tổng giá trị{' '}
          <span className="font-bold">{quote ? formatMoney(quote.totalAmount) : formatMoney(subtotal)}</span>.
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
