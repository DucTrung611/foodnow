import { registerAs } from '@nestjs/config';

export default registerAs('order', () => ({
  baseDeliveryFee: parseInt(process.env.ORDER_BASE_DELIVERY_FEE ?? '15000', 10),
  perKmDeliveryFee: parseInt(
    process.env.ORDER_PER_KM_DELIVERY_FEE ?? '3000',
    10,
  ),
}));
