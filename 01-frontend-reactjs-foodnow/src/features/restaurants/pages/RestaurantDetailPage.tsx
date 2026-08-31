import { useParams } from 'react-router-dom';
import { Badge, Skeleton } from '@/shared/components/ui';
import { MenuItemRow } from '../components/MenuItemRow';
import { useRestaurant, useRestaurantMenu } from '../hooks/useRestaurant';

export function RestaurantDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: restaurant, isLoading: isLoadingRestaurant } = useRestaurant(id);
  const { data: menu, isLoading: isLoadingMenu } = useRestaurantMenu(id);

  if (isLoadingRestaurant) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    );
  }

  if (!restaurant) return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {restaurant.imageUrl && (
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="mb-6 aspect-[16/7] w-full rounded-ticket object-cover"
        />
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{restaurant.name}</h1>
        <Badge variant={restaurant.isOpen ? 'success' : 'neutral'}>{restaurant.isOpen ? 'Đang mở' : 'Đã đóng'}</Badge>
      </div>
      {restaurant.description && <p className="mt-2 text-sm text-muted">{restaurant.description}</p>}

      <div className="mt-8 flex flex-col gap-8">
        {isLoadingMenu && <Skeleton className="h-40 w-full" />}
        {menu?.categories.map((category) => (
          <section key={category.id}>
            <h2 className="font-display text-lg font-bold text-ink">{category.name}</h2>
            <div className="mt-3 flex flex-col divide-y divide-muted-border">
              {category.items.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
