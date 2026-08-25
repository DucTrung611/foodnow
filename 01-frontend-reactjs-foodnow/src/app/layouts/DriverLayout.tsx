import { Link, Outlet } from 'react-router-dom';
import { ROUTES } from '@/app/routes/routes.config';

export function DriverLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-display text-lg font-bold">
          Food<span className="text-primary">Now</span> <span className="text-xs font-sans font-normal text-paper/60">Driver</span>
        </span>
        <nav className="flex gap-6 font-sans text-sm">
          <Link to={ROUTES.driverOffers}>Đơn hàng</Link>
          <Link to={ROUTES.driverEarnings}>Thu nhập</Link>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
