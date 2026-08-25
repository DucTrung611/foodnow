import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.config';

export function VendorLayout() {
  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="flex w-56 flex-col gap-1 border-r border-muted-border p-4">
        <span className="mb-4 font-display text-lg font-bold text-ink">
          Food<span className="text-primary">Now</span> <span className="text-xs font-sans font-normal text-muted">Vendor</span>
        </span>
        <Link to={ROUTES.vendorOrders} className="rounded-ticket px-3 py-2 text-sm text-ink hover:bg-primary-bg">
          Đơn hàng
        </Link>
        <Link to={ROUTES.vendorMenu} className="rounded-ticket px-3 py-2 text-sm text-ink hover:bg-primary-bg">
          Thực đơn
        </Link>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
