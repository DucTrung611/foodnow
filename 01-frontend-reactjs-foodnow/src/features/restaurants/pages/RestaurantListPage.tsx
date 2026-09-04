import { useState } from 'react';
import { EmptyState, ErrorState, Select, Skeleton } from '@/shared/components/ui';
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

type SortOption = 'distance' | '-avgRating';

export function RestaurantListPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>('-avgRating');
  const debouncedSearch = useDebounce(search);
  const { position } = useGeolocation();

  const { data, isLoading, isError, refetch } = useRestaurants({
    search: debouncedSearch || undefined,
    lat: position?.lat ?? CITY_CENTER.lat,
    lng: position?.lng ?? CITY_CENTER.lng,
    radius: CITYWIDE_RADIUS_METERS,
    // "Gần nhất" only means something once we actually have the user's
    // position — otherwise it would silently sort by the city-center
    // fallback point, which isn't what "nearest" implies to the user.
    sort: sort === 'distance' && !position ? '-avgRating' : sort,
    limit: 100, // backend's max — avoids silently truncating to the default page size of 20
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-display-lg text-ink">Nhà hàng gần bạn</h1>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm nhà hàng, món ăn..."
            aria-label="Tìm nhà hàng, món ăn"
            className="min-h-11 w-full rounded-ticket border border-muted-border bg-paper py-2.5 pl-10 pr-10 font-sans text-body text-ink outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/50"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Xóa tìm kiếm"
              className="absolute right-1 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted transition-colors hover:bg-muted-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <Select
          aria-label="Sắp xếp theo"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="sm:w-52"
        >
          <option value="-avgRating">Đánh giá cao nhất</option>
          <option value="distance">Gần nhất</option>
        </Select>
      </div>

      {!isLoading && !isError && (
        <p className="mt-4 text-body-sm text-muted">
          {data && data.items.length > 0 ? `Tìm thấy ${data.meta.total} nhà hàng` : null}
        </p>
      )}

      <div className="mt-4">
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-56 w-full" count={6} />
          </div>
        )}

        {!isLoading && isError && (
          <ErrorState title="Không tải được danh sách nhà hàng" onRetry={() => refetch()} />
        )}

        {!isLoading && !isError && data?.items.length === 0 && (
          <EmptyState
            title="Không tìm thấy nhà hàng phù hợp"
            description="Thử một từ khóa khác hoặc bỏ bớt điều kiện tìm kiếm."
          />
        )}

        {!isLoading && !isError && data && data.items.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
