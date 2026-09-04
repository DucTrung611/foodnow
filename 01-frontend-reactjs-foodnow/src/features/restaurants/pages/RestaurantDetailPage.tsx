import { Link, useParams } from 'react-router-dom';
import { Badge, ErrorState, FallbackImage, Skeleton } from '@/shared/components/ui';
import { calculateCartSubtotal, useCart } from '@/features/orders';
import { formatMoney } from '@/shared/utils/money';
import { ROUTES } from '@/app/routes/routes.config';
import { MenuItemRow } from '../components/MenuItemRow';
import { useRestaurant, useRestaurantMenu } from '../hooks/useRestaurant';
import { getTodayHoursLabel } from '../utils/opening-hours';

export function RestaurantDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: restaurant, isLoading: isLoadingRestaurant, isError, refetch } = useRestaurant(id);
  const { data: menu, isLoading: isLoadingMenu } = useRestaurantMenu(id);
  const { data: cart } = useCart();

  const cartBelongsHere = cart?.restaurantId === id && cart.items.length > 0;

  if (isLoadingRestaurant) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="aspect-[16/7] w-full" />
        <Skeleton className="mt-6 h-8 w-1/2" />
        <Skeleton className="mt-3 h-4 w-1/3" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState title="Không tải được thông tin nhà hàng" onRetry={() => refetch()} />;
  }

  if (!restaurant) {
    return (
      <ErrorState
        title="Không tìm thấy nhà hàng"
        description="Nhà hàng này có thể đã ngừng hoạt động."
      />
    );
  }

  return (
    <div className={`mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10 ${cartBelongsHere ? 'pb-28' : ''}`}>
      <Link to={ROUTES.restaurants} className="inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-ink">
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Nhà hàng
      </Link>

      {restaurant.imageUrl && (
        <FallbackImage
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="mb-6 mt-3 aspect-[16/7] w-full rounded-card"
        />
      )}

      <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h1 className="font-display text-display-lg text-ink">{restaurant.name}</h1>
        <Badge variant={restaurant.isOpen ? 'success' : 'neutral'}>{restaurant.isOpen ? 'Đang mở' : 'Đã đóng'}</Badge>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-muted">
        {Number(restaurant.avgRating) > 0 ? (
          <span className="flex items-center gap-1">
            <svg className="size-3.5 text-accent" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
              <path d="M8 1.5l1.9 4.3 4.6.5-3.5 3.1 1 4.6L8 11.7l-4 2.3 1-4.6-3.5-3.1 4.6-.5L8 1.5z" />
            </svg>
            {Number(restaurant.avgRating).toFixed(1)}
          </span>
        ) : (
          <span>Chưa có đánh giá</span>
        )}
        <span>{getTodayHoursLabel(restaurant.openingHours)}</span>
      </div>

      {restaurant.description && <p className="mt-3 text-body text-ink">{restaurant.description}</p>}

      {menu && menu.categories.length > 1 && (
        <nav
          aria-label="Danh mục món ăn"
          className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto border-b border-muted-border bg-paper px-4 py-3 sm:-mx-6 sm:px-6"
        >
          {menu.categories.map((category) => (
            <a
              key={category.id}
              href={`#category-${category.id}`}
              className="shrink-0 rounded-full border border-muted-border px-3.5 py-1.5 text-body-sm text-ink transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-6 flex flex-col gap-8">
        {isLoadingMenu && <Skeleton className="h-40 w-full" />}
        {menu?.categories.map((category) => (
          <section key={category.id} id={`category-${category.id}`} className="scroll-mt-16">
            <h2 className="font-display text-display-md text-ink">{category.name}</h2>
            <div className="mt-3 flex flex-col divide-y divide-muted-border">
              {category.items.map((item) => (
                <MenuItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {cartBelongsHere && cart && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-muted-border bg-paper px-4 py-3 shadow-float sm:px-6">
          <Link
            to={ROUTES.checkout}
            className="mx-auto flex max-w-3xl items-center justify-between rounded-ticket bg-primary px-4 py-3 text-paper transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <span className="text-body-sm">
              {cart.items.length} món · {formatMoney(calculateCartSubtotal(cart.items))}
            </span>
            <span className="font-medium">Xem giỏ hàng</span>
          </Link>
        </div>
      )}
    </div>
  );
}
