import { apiClient, unwrap, unwrapPaginated } from '@/shared/services/client';
import type { CreateOrderPayload, Order, OrderListParams, UpdateOrderStatusPayload } from '../types/orders.types';

export const ordersService = {
  create: (payload: CreateOrderPayload) => unwrap<Order>(apiClient.post('/orders', payload)),
  list: (params: OrderListParams) => unwrapPaginated<Order>(apiClient.get('/orders', { params })),
  getById: (id: string) => unwrap<Order>(apiClient.get(`/orders/${id}`)),
  updateStatus: (id: string, payload: UpdateOrderStatusPayload) =>
    unwrap<Order>(apiClient.patch(`/orders/${id}/status`, payload)),
  cancel: (id: string, reason: string) => unwrap<Order>(apiClient.post(`/orders/${id}/cancel`, { reason })),
};
