import { Link, Outlet } from 'react-router-dom';
import { AccountMenu } from '@/features/auth';
import { ROUTES } from '@/app/routes/routes.config';

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-paper md:flex-row">
      <aside className="flex flex-wrap items-center justify-between gap-2 border-b border-muted-border p-4 md:w-56 md:flex-col md:flex-nowrap md:items-stretch md:border-b-0 md:border-r">
        <span className="font-display text-lg font-bold text-ink md:mb-4">
          Food<span className="text-primary">Now</span> <span className="text-xs font-sans font-normal text-muted">Admin</span>
        </span>
        <nav className="flex items-center gap-1 md:flex-col md:items-stretch md:gap-1">
          <Link to={ROUTES.adminOrders} className="rounded-ticket px-3 py-2 text-sm text-ink hover:bg-primary-bg">
            Đơn hàng
          </Link>
          <Link to={ROUTES.adminUsers} className="rounded-ticket px-3 py-2 text-sm text-ink hover:bg-primary-bg">
            Người dùng
          </Link>
        </nav>
        <div className="md:mt-auto">
          <AccountMenu />
        </div>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
