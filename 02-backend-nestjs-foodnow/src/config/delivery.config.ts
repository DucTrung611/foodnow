import { registerAs } from '@nestjs/config';

export default registerAs('delivery', () => ({
  searchRadiusMeters: parseInt(
    process.env.DELIVERY_SEARCH_RADIUS_METERS ?? '5000',
    10,
  ),
  averageSpeedKmh: parseInt(process.env.DELIVERY_AVERAGE_SPEED_KMH ?? '30', 10),
  offerExpirySeconds: parseInt(
    process.env.DELIVERY_OFFER_EXPIRY_SECONDS ?? '60',
    10,
  ),
}));
