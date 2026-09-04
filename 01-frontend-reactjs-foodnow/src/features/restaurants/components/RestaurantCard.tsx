import { Link } from 'react-router-dom';
import { Badge, FallbackImage } from '@/shared/components/ui';
import { formatDistance } from '@/shared/utils/geo';
import { ROUTES } from '@/app/routes/routes.config';
import type { Restaurant } from '../types/restaurants.types';

type RestaurantCardProps = {
  restaurant: Restaurant;
};

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const hasRating = Number(restaurant.avgRating) > 0;

  return (
    <Link
      to={ROUTES.restaurantDetail(restaurant.id)}
      className="flex flex-col gap-2 overflow-hidden rounded-card border border-muted-border bg-paper transition-shadow hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <FallbackImage src={restaurant.imageUrl} alt={restaurant.name} className="aspect-[4/3] w-full" />

      <div className="flex flex-col gap-2 p-4 pt-0">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <h3 className="font-display text-body-lg font-semibold text-ink">{restaurant.name}</h3>
          <Badge variant={restaurant.isOpen ? 'success' : 'neutral'}>{restaurant.isOpen ? 'Đang mở' : 'Đã đóng'}</Badge>
        </div>
        {restaurant.description && <p className="line-clamp-2 text-body-sm text-muted">{restaurant.description}</p>}
        <div className="flex items-center gap-3 text-body-sm text-muted">
          {hasRating ? (
            <span className="flex items-center gap-1">
              <svg className="size-3.5 text-accent" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                <path d="M8 1.5l1.9 4.3 4.6.5-3.5 3.1 1 4.6L8 11.7l-4 2.3 1-4.6-3.5-3.1 4.6-.5L8 1.5z" />
              </svg>
              {Number(restaurant.avgRating).toFixed(1)}
            </span>
          ) : (
            <span>Chưa có đánh giá</span>
          )}
          {restaurant.distanceMeters !== undefined && <span>{formatDistance(restaurant.distanceMeters)}</span>}
        </div>
      </div>
    </Link>
  );
}
