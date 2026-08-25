import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/app/routes/routes.config';

export function CustomerLayout() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      <header className="flex items-center justify-between border-b border-muted-border px-6 py-4">
        <Link to={ROUTES.home} className="font-display text-xl font-bold text-ink">
          Food<span className="text-primary">Now</span>
        </Link>
        <nav className="flex items-center gap-6 font-sans text-sm text-ink">
          <Link to={ROUTES.restaurants}>Nhà hàng</Link>
          <Link to={ROUTES.orders}>Đơn hàng</Link>
          {user ? (
            <span className="font-medium">{user.fullName}</span>
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
