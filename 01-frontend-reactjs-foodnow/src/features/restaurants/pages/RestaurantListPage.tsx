import { useState } from 'react';
import { Skeleton } from '@/shared/components/ui';
import { useGeolocation } from '@/shared/hooks/useGeolocation';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { RestaurantCard } from '../components/RestaurantCard';
import { useRestaurants } from '../hooks/useRestaurants';

/**
 * FoodNow is a single-city marketplace (CLAUDE.md) — every restaurant sits
 * within a few km of central Hanoi. The backend's public search requires
 * lat/lng and defaults its radius to 5km, so a customer whose real (or
 * denied/imprecise) geolocation resolves even slightly outside that radius
 * saw a false-empty "Không tìm thấy nhà hàng phù hợp" with no real
 * restaurants nearby to fix it (UX-AUDIT-REPORT.md §1.1). Falling back to a
 * fixed city-center point with a radius wide enough to cover the whole
 * city — rather than depending on the browser's geolocation resolving
 * precisely — makes this page reliably show every restaurant.
 */
const CITY_CENTER = { lat: 21.0245, lng: 105.8412 };
const CITYWIDE_RADIUS_METERS = 20000;

export function RestaurantListPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const { position } = useGeolocation();

  const { data, isLoading } = useRestaurants({
    search: debouncedSearch || undefined,
    lat: position?.lat ?? CITY_CENTER.lat,
    lng: position?.lng ?? CITY_CENTER.lng,
    radius: CITYWIDE_RADIUS_METERS,
    sort: position ? 'distance' : '-avgRating',
    limit: 100, // backend's max — avoids silently truncating to the default page size of 20
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
