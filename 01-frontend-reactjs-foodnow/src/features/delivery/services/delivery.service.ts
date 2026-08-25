import { apiClient, unwrap } from '@/shared/services/client';
import type { GeoPoint } from '@/shared/utils/geo';
import type {
  AvailableDelivery,
  Delivery,
  DeliveryTrackingSnapshot,
  DriverEarningsSummary,
} from '../types/delivery.types';

export const deliveryService = {
  setAvailability: (isAvailable: boolean) =>
    unwrap<{ isAvailable: boolean }>(apiClient.patch('/drivers/me/availability', { isAvailable })),

  listAvailable: () => unwrap<AvailableDelivery[]>(apiClient.get('/deliveries/available')),

  accept: (id: string) => unwrap<Delivery>(apiClient.post(`/deliveries/${id}/accept`)),
  pickup: (id: string) => unwrap<Delivery>(apiClient.post(`/deliveries/${id}/pickup`)),
  complete: (id: string) => unwrap<Delivery>(apiClient.post(`/deliveries/${id}/complete`)),

  pushLocation: (point: GeoPoint & { orderId?: string }) => apiClient.post('/drivers/me/locations', point),

  getTracking: (orderId: string) => unwrap<DeliveryTrackingSnapshot>(apiClient.get(`/orders/${orderId}/tracking`)),

  getEarnings: () => unwrap<DriverEarningsSummary>(apiClient.get('/drivers/me/earnings')),
};
