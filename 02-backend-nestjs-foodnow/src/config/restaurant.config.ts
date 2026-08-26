import { registerAs } from '@nestjs/config';

export default registerAs('restaurant', () => ({
  defaultSearchRadiusMeters: parseInt(
    process.env.RESTAURANT_DEFAULT_RADIUS_METERS ?? '5000',
    10,
  ),
}));
