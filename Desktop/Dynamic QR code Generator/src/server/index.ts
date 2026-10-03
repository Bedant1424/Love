import { Hono } from 'hono';
import type { Env } from './types';
import type { HealthResponse } from '../shared/types';

const app = new Hono<{ Bindings: Env }>();

/**
 * Global Security Headers Middleware
 */
app.use('*', async (c, next) => {
  await next();
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
});

/**
 * Health Check Endpoint
 * Used by UptimeRobot Free and CI/CD validation
 */
app.get('/healthz', (c) => {
  const response: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT ?? 'development',
  };
  return c.json(response, 200);
});

/**
 * Fallback to Workers Static Assets for frontend routes
 */
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('QRoute Foundation Running (Static Assets binding not detected)', 200);
});

export default app;
