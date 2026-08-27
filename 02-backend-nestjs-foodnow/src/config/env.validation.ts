import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().uri().required(),
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().default(6379),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  RESTAURANT_DEFAULT_RADIUS_METERS: Joi.number().default(5000),
  ORDER_BASE_DELIVERY_FEE: Joi.number().default(15000),
  ORDER_PER_KM_DELIVERY_FEE: Joi.number().default(3000),
  DELIVERY_SEARCH_RADIUS_METERS: Joi.number().default(5000),
  DELIVERY_AVERAGE_SPEED_KMH: Joi.number().default(30),
  DELIVERY_OFFER_EXPIRY_SECONDS: Joi.number().default(60),
});
