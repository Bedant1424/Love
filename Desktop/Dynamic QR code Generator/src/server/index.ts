import { Hono } from 'hono';
import type { Env, AppVariables } from './types';
import type { HealthResponse } from '../shared/types';
import { createErrorResponse } from '../shared/utils';
import { handleRedirectRequest } from './redirect';
import { handleActivationRequest, handleCardStatusRequest } from './activation';
import { adminAuthMiddleware } from './admin-auth';
import {
  handleAdminDashboard,
  handleAdminListCards,
  handleAdminGetCard,
  handleAdminCreateBatch,
  handleAdminListBatches,
  handleAdminDisableCard,
  handleAdminRestoreCard,
  handleAdminRetireCard,
  handleAdminUpdateCard,
  handleAdminListAuditLogs,
} from './admin';

const app = new Hono<{ Bindings: Env; Variables: AppVariables }>();

/**
 * Global Security Headers Middleware
 * Sets baseline security headers before handler execution.
 */
app.use('*', async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()'
  );
  await next();
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
 * Public Card Redirect Engine
 * GET /c/:publicId -> 302 Found or controlled state page
 */
app.get('/c/:publicId', async (c) => {
  return handleRedirectRequest(c, false);
});

/**
 * Public Card Redirect Engine (HEAD)
 * Emits identical headers as GET with empty body
 */
app.on('HEAD', '/c/:publicId', async (c) => {
  return handleRedirectRequest(c, true);
});

/**
 * Public Card Redirect Engine (OPTIONS)
 */
app.on('OPTIONS', '/c/:publicId', (c) => {
  c.header('Allow', 'GET, HEAD, OPTIONS');
  return c.body(null, 204);
});

/**
 * Reject unsupported HTTP methods on /c/:publicId
 */
app.all('/c/:publicId', (c) => {
  c.header('Allow', 'GET, HEAD, OPTIONS');
  return c.json(
    createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed on redirect endpoint'),
    405
  );
});

/**
 * Bare /c path handler -> 404
 */
app.all('/c', (c) => {
  return c.json(
    createErrorResponse(
      'NOT_FOUND',
      'Card not found. Please verify that you scanned an official review card.'
    ),
    404
  );
});

/**
 * Public Card Status API Endpoint
 * GET /api/public/card/:publicId/status
 */
app.get('/api/public/card/:publicId/status', async (c) => {
  return handleCardStatusRequest(c);
});

/**
 * Public Card Activation API Endpoint
 * POST /api/public/activate
 */
app.post('/api/public/activate', async (c) => {
  return handleActivationRequest(c);
});

app.all('/api/public/activate', (c) => {
  c.header('Allow', 'POST');
  return c.json(
    createErrorResponse('METHOD_NOT_ALLOWED', 'Method not allowed on activation endpoint'),
    405
  );
});

/**
 * Admin API Security Boundary
 * Protected by Cloudflare Access Zero Trust authentication
 */
app.use('/api/admin/*', adminAuthMiddleware);

app.get('/api/admin/dashboard', handleAdminDashboard);
app.get('/api/admin/cards', handleAdminListCards);
app.get('/api/admin/cards/:id', handleAdminGetCard);
app.post('/api/admin/cards/:id/disable', handleAdminDisableCard);
app.post('/api/admin/cards/:id/restore', handleAdminRestoreCard);
app.post('/api/admin/cards/:id/retire', handleAdminRetireCard);
app.patch('/api/admin/cards/:id', handleAdminUpdateCard);
app.get('/api/admin/batches', handleAdminListBatches);
app.post('/api/admin/batches', handleAdminCreateBatch);
app.get('/api/admin/audit', handleAdminListAuditLogs);

/**
 * Unmatched API routes handler -> 404 JSON
 * Guarantees that SPA fallback does not swallow non-existent API routes.
 */
app.all('/api/*', (c) => {
  return c.json(
    createErrorResponse('NOT_FOUND', 'API endpoint not found. Verify request URL and method.'),
    404
  );
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
