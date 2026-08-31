import type { GeoPoint } from '@/shared/utils/geo';

/** Confirmed against the backend's actual `DeliveryStatus` Prisma enum (delivery/context.md) — the terminal state is `DELIVERED`, not `COMPLETED`. */
export type DeliveryStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

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

/** Matches backend `EarningsSummaryResponseDto` (features/earnings) exactly — field names are not the same as the naive "totalEarned/pendingPayout/entries" guess this used to have, which MSW-mocked tests hid until the real endpoint 200'd with a shape mismatch and crashed the page. */
export type DriverEarningsSummary = {
  totalPendingAmount: string;
  totalPaidAmount: string;
  earnings: DriverEarningEntry[];
};
