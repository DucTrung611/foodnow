/**
 * `@WebSocketGateway()` cors must be a static object (decorators evaluate at
 * class-definition time, before Nest DI/ConfigService exist) — same
 * `CORS_ORIGIN` env var and default as `app.config.ts`, duplicated here for
 * the one place that can't inject ConfigService.
 */
export const REALTIME_NAMESPACE = 'realtime';

export const REALTIME_CORS = {
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
};
