import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { AccountMenu } from '@/features/auth';
import { CartBadge } from '@/features/orders';
import { ROUTES } from '@/app/routes/routes.config';

export function CustomerLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-muted-border px-4 py-4 sm:px-6">
        <Link to={ROUTES.home} className="font-display text-xl font-bold text-ink">
          Food<span className="text-primary">Now</span>
        </Link>
        <nav className="flex items-center gap-4 font-sans text-sm text-ink sm:gap-6">
          <Link to={ROUTES.restaurants}>Nhà hàng</Link>
          {user && <Link to={ROUTES.orders}>Đơn hàng</Link>}
          {user && <CartBadge />}
          {user ? (
            <AccountMenu />
          ) : (
            <Link to={ROUTES.login} className="font-medium text-primary">
              Đăng nhập
            </Link>
          )}
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
