import { useAuthStore } from '@/shared/stores/auth.store';
import { Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useRestaurantMenu } from '../hooks/useRestaurant';

/**
 * TODO: vendor menu CRUD (create/edit category, item, option groups).
 * Read path wired to GET /restaurants/:id/menu; write mutations live in
 * useMenuItemMutations.ts, ready to hook into an editable form here.
 */
export function VendorMenuPage() {
  const restaurantId = useAuthStore((s) => s.user?.id) ?? '';
  const { data: menu, isLoading } = useRestaurantMenu(restaurantId);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Thực đơn</h1>

      <div className="mt-6 flex flex-col gap-6">
        {isLoading && <Skeleton className="h-32 w-full" />}
        {menu?.categories.map((category) => (
          <section key={category.id}>
            <h2 className="font-display text-base font-bold text-ink">{category.name}</h2>
            <div className="mt-2 flex flex-col divide-y divide-muted-border">
              {category.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink">{item.name}</span>
                  <span className="font-mono text-sm text-muted">{formatMoney(item.basePrice)}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
