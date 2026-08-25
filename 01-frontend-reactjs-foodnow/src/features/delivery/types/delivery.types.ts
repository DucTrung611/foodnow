import type { GeoPoint } from '@/shared/utils/geo';

/**
 * ASSIGNED/PICKED_UP/COMPLETED are inferred from the accept/pickup/complete
 * REST actions (API_SPEC.md §6 Delivery) — confirm against the backend
 * Prisma enum once the delivery module is implemented there.
 */
export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'COMPLETED' | 'CANCELLED';

export type Delivery = {
  id: string;
  orderId: string;
  driverId: string;
  pickupTime: string | null;
  deliveryTime: string | null;
  estimatedDistanceKm: string;
  status: DeliveryStatus;
};

export type AvailableDelivery = {
  orderId: string;
  restaurantId: string;
  distanceMeters: number;
  estimatedEarning: string;
};

/** Matches the `driver:new_offer` socket payload (API_SPEC.md Socket.IO §). */
export type DriverOffer = {
  orderId: string;
  distanceMeters: number;
  estimatedEarning: string;
  expiresAt: string;
};

/** Matches GET /orders/:id/tracking and the `delivery:location` socket payload. */
export type DeliveryTrackingSnapshot = GeoPoint & {
  recordedAt: string;
  etaMinutes: number;
};

export type DriverEarningStatus = 'PENDING' | 'PAID';

export type DriverEarningEntry = {
  id: string;
  deliveryId: string;
  amount: string;
  status: DriverEarningStatus;
  paidAt: string | null;
  createdAt: string;
};

export type DriverEarningsSummary = {
  totalEarned: string;
  pendingPayout: string;
  entries: DriverEarningEntry[];
};
