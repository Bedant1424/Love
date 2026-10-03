import { describe, it, expect } from 'vitest';
import { env } from 'cloudflare:test';
import app from '../../src/server/index';

describe('Worker Health & Runtime Foundation', () => {
  it('GET /healthz returns 200 OK with status ok', async () => {
    const req = new Request('http://localhost/healthz', {
      method: 'GET',
    });

    const res = await app.fetch(req, env);
    expect(res.status).toBe(200);

    const body = await res.json<{ status: string; environment: string }>();
    expect(body.status).toBe('ok');
    expect(body.environment).toBeDefined();
  });

  it('emits mandatory security headers on responses', async () => {
    const req = new Request('http://localhost/healthz', {
      method: 'GET',
    });

    const res = await app.fetch(req, env);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(res.headers.get('Permissions-Policy')).toBeDefined();
  });
});
