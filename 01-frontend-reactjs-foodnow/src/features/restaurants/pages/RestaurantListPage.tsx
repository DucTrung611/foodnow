import { useState } from 'react';
import { Skeleton } from '@/shared/components/ui';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { RestaurantCard } from '../components/RestaurantCard';
import { useRestaurants } from '../hooks/useRestaurants';

export function RestaurantListPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { position } = useGeolocation();

  const { data, isLoading } = useRestaurants({
    search: debouncedSearch || undefined,
    lat: position?.lat,
    lng: position?.lng,
    radius: position ? 5000 : undefined,
    sort: position ? 'distance' : '-avgRating',
  });

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Tìm nhà hàng, món ăn..."
        className="w-full rounded-ticket border border-muted-border px-4 py-3 font-sans text-sm outline-none focus:border-primary"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <Skeleton className="h-32 w-full" count={6} />}
        {data?.items.map((restaurant) => (
          <RestaurantCard key={restaurant.id} restaurant={restaurant} />
        ))}
      </div>

      {!isLoading && data?.items.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">Không tìm thấy nhà hàng phù hợp.</p>
      )}
    </div>
  );
}
