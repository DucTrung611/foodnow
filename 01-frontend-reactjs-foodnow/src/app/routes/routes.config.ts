import type { Role } from '@/shared/types';

/** Single source of URLs — no hardcoded path strings in navigate() calls. */
export const ROUTES = {
  home: '/',
  login: '/login',
  register: '/register',
  profile: '/profile',
  restaurants: '/restaurants',
  restaurantDetail: (id: string) => `/restaurants/${id}`,

  checkout: '/checkout',
  orders: '/orders',
  orderDetail: (id: string) => `/orders/${id}`,
  orderTracking: (id: string) => `/orders/${id}/tracking`,

  vendorRoot: '/vendor',
  vendorMenu: '/vendor/menu',
  vendorOrders: '/vendor/orders',

  driverRoot: '/driver',
  driverOffers: '/driver/offers',
  driverEarnings: '/driver/earnings',

  adminRoot: '/admin',
  adminOrders: '/admin/orders',
  adminUsers: '/admin/users',
} as const;

/**
 * Every non-customer role has its own dashboard — none of them are linked
 * from the customer homepage, so landing there post-login stranded the user
 * (UX-AUDIT-REPORT.md §0 "Post-login redirect"). Single source of truth for
 * "where does this role land" — both `GuestRoute` (redirecting an
 * already-authenticated user away from /login) and a fresh login read this,
 * so there's exactly one navigation decision instead of two competing ones.
 */
export const HOME_ROUTE_BY_ROLE: Record<Role, string> = {
  CUSTOMER: ROUTES.home,
  VENDOR: ROUTES.vendorOrders,
  DRIVER: ROUTES.driverOffers,
  ADMIN: ROUTES.adminOrders,
};
