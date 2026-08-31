import { Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useMyRestaurant, useRestaurantMenu } from '../hooks/useRestaurant';

/**
 * TODO: vendor menu CRUD (create/edit category, item, option groups).
 * Read path wired to GET /restaurants/:id/menu; write mutations live in
 * useMenuItemMutations.ts, ready to hook into an editable form here.
 */
export function VendorMenuPage() {
  const { data: restaurant, isLoading: isLoadingRestaurant, isError: isRestaurantError } = useMyRestaurant();
  const restaurantId = restaurant?.id ?? '';
  const { data: menu, isLoading: isLoadingMenu, isError: isMenuError } = useRestaurantMenu(restaurantId);

  const isLoading = isLoadingRestaurant || (Boolean(restaurantId) && isLoadingMenu);

  if (!isLoadingRestaurant && isRestaurantError) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-ink">Thực đơn</h1>
        <p className="mt-6 rounded-ticket border border-danger-bg bg-danger-bg px-4 py-3 text-sm text-danger">
          Không tìm thấy nhà hàng của bạn. Vui lòng liên hệ quản trị viên.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Thực đơn</h1>

      <div className="mt-6 flex flex-col gap-6">
        {isLoading && <Skeleton className="h-32 w-full" />}
        {!isLoading && isMenuError && (
          <p className="rounded-ticket border border-danger-bg bg-danger-bg px-4 py-3 text-sm text-danger">
            Không thể tải thực đơn. Vui lòng thử lại sau.
          </p>
        )}
        {!isLoading && !isMenuError && menu?.categories.length === 0 && (
          <p className="text-sm text-muted">Chưa có món ăn nào trong thực đơn.</p>
        )}
        {menu?.categories.map((category) => (
          <section key={category.id}>
            <h2 className="font-display text-base font-bold text-ink">{category.name}</h2>
            <div className="mt-2 flex flex-col divide-y divide-muted-border">
              {category.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-2.5">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} loading="lazy" className="size-10 shrink-0 rounded-ticket object-cover" />
                  )}
                  <span className="flex-1 text-sm text-ink">{item.name}</span>
                  <span className="font-mono text-sm text-ink">{formatMoney(item.basePrice)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
