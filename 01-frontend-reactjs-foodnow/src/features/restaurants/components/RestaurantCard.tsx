import { Link } from 'react-router-dom';
import { Badge } from '@/shared/components/ui';
import { formatDistance } from '@/shared/utils/geo';
import { ROUTES } from '@/app/routes/routes.config';
import type { Restaurant } from '../types/restaurants.types';

type RestaurantCardProps = {
  restaurant: Restaurant;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      to={ROUTES.restaurantDetail(restaurant.id)}
      className="flex flex-col gap-2 rounded-ticket border border-muted-border bg-paper p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-base font-bold text-ink">{restaurant.name}</h3>
        <Badge variant={restaurant.isOpen ? 'success' : 'neutral'}>{restaurant.isOpen ? 'Đang mở' : 'Đã đóng'}</Badge>
      </div>
      {restaurant.description && <p className="line-clamp-2 text-sm text-muted">{restaurant.description}</p>}
      <div className="flex items-center gap-3 font-mono text-xs text-muted">
        <span>★ {restaurant.avgRating}</span>
        {restaurant.distanceMeters !== undefined && <span>{formatDistance(restaurant.distanceMeters)}</span>}
      </div>
    </Link>
  );
}
