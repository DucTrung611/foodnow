/* eslint-disable react-refresh/only-export-components -- route table: lazy() component refs live alongside the non-component `router` export by design */
import { lazy, Suspense, type ReactElement, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Skeleton } from '@/shared/components/ui';
import { CustomerLayout } from '@/app/layouts/CustomerLayout';
import { VendorLayout } from '@/app/layouts/VendorLayout';
import { DriverLayout } from '@/app/layouts/DriverLayout';
import { AdminLayout } from '@/app/layouts/AdminLayout';
import { GuestRoute } from './GuestRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { ROUTES } from './routes.config';

const HomePage = lazy(() => import('@/features/restaurants').then((m) => ({ default: m.HomePage })));
const RestaurantListPage = lazy(() => import('@/features/restaurants').then((m) => ({ default: m.RestaurantListPage })));
const RestaurantDetailPage = lazy(() => import('@/features/restaurants').then((m) => ({ default: m.RestaurantDetailPage })));
const VendorMenuPage = lazy(() => import('@/features/restaurants').then((m) => ({ default: m.VendorMenuPage })));

const LoginPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth').then((m) => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/features/auth').then((m) => ({ default: m.ProfilePage })));

const CheckoutPage = lazy(() => import('@/features/orders').then((m) => ({ default: m.CheckoutPage })));
const OrderListPage = lazy(() => import('@/features/orders').then((m) => ({ default: m.OrderListPage })));
const OrderDetailPage = lazy(() => import('@/features/orders').then((m) => ({ default: m.OrderDetailPage })));
const VendorOrdersPage = lazy(() => import('@/features/orders').then((m) => ({ default: m.VendorOrdersPage })));

const DriverOffersPage = lazy(() => import('@/features/delivery').then((m) => ({ default: m.DriverOffersPage })));
const DriverEarningsPage = lazy(() => import('@/features/delivery').then((m) => ({ default: m.DriverEarningsPage })));
const OrderTrackingPage = lazy(() => import('@/features/delivery').then((m) => ({ default: m.OrderTrackingPage })));

const AdminOrdersPage = lazy(() => import('@/features/admin').then((m) => ({ default: m.AdminOrdersPage })));
const AdminUsersPage = lazy(() => import('@/features/admin').then((m) => ({ default: m.AdminUsersPage })));

/** Layout-matching fallback, never a bare spinner on blank (PROJECT-RULES-FRONTEND.md §5). */
function withSuspense(element: ReactElement): ReactNode {
  return (
    <Suspense fallback={<div className="p-8"><Skeleton className="h-40 w-full" /></div>}>
      {element}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    // Pathless root: errorElement here catches thrown render errors from any
    // descendant route AND unmatched paths (React Router renders those as a
    // 404 ErrorResponse through the same mechanism) — one boundary handles
    // both instead of falling through to the raw dev error screen.
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: ROUTES.home, element: withSuspense(<HomePage />) },
          { path: ROUTES.login, element: <GuestRoute>{withSuspense(<LoginPage />)}</GuestRoute> },
          { path: ROUTES.register, element: <GuestRoute>{withSuspense(<RegisterPage />)}</GuestRoute> },
          { path: ROUTES.restaurants, element: withSuspense(<RestaurantListPage />) },
          { path: '/restaurants/:id', element: withSuspense(<RestaurantDetailPage />) },
          { path: ROUTES.profile, element: <ProtectedRoute>{withSuspense(<ProfilePage />)}</ProtectedRoute> },
          {
            path: ROUTES.checkout,
            element: <ProtectedRoute roles={['CUSTOMER']}>{withSuspense(<CheckoutPage />)}</ProtectedRoute>,
          },
          { path: ROUTES.orders, element: <ProtectedRoute>{withSuspense(<OrderListPage />)}</ProtectedRoute> },
          { path: '/orders/:id', element: <ProtectedRoute>{withSuspense(<OrderDetailPage />)}</ProtectedRoute> },
          {
            path: '/orders/:id/tracking',
            element: <ProtectedRoute roles={['CUSTOMER']}>{withSuspense(<OrderTrackingPage />)}</ProtectedRoute>,
          },
        ],
      },
      {
        element: (
          <ProtectedRoute roles={['VENDOR']}>
            <VendorLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: ROUTES.vendorOrders, element: withSuspense(<VendorOrdersPage />) },
          { path: ROUTES.vendorMenu, element: withSuspense(<VendorMenuPage />) },
        ],
      },
      {
        element: (
          <ProtectedRoute roles={['DRIVER']}>
            <DriverLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: ROUTES.driverOffers, element: withSuspense(<DriverOffersPage />) },
          { path: ROUTES.driverEarnings, element: withSuspense(<DriverEarningsPage />) },
        ],
      },
      {
        element: (
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: ROUTES.adminOrders, element: withSuspense(<AdminOrdersPage />) },
          { path: ROUTES.adminUsers, element: withSuspense(<AdminUsersPage />) },
        ],
      },
    ],
  },
]);
