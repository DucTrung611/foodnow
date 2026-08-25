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
