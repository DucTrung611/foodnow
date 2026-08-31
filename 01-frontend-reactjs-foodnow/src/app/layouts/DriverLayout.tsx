import { Link, Outlet } from 'react-router-dom';
import { AccountMenu } from '@/features/auth';
import { ROUTES } from '@/app/routes/routes.config';

export function DriverLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-ink text-paper">
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-4 sm:px-6">
        <span className="font-display text-lg font-bold">
          Food<span className="text-primary">Now</span> <span className="text-xs font-sans font-normal text-paper/60">Driver</span>
        </span>
        <nav className="flex items-center gap-4 font-sans text-sm sm:gap-6">
          <Link to={ROUTES.driverOffers}>Đơn hàng</Link>
          <Link to={ROUTES.driverEarnings}>Thu nhập</Link>
          <AccountMenu variant="dark" />
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
