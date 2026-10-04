import { describe, it, expect, beforeAll, vi, beforeEach, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import type { Env } from '../../src/server/types';
import app from '../../src/server/index';
import { hashActivationCode } from '../../src/shared/activation-crypto';

describe('Production Deployment & Launch Readiness (/healthz, /c/:id, /api/public/activate, /api/admin/*)', () => {
  const PROD_SECRET = 'production_super_secret_activation_key_32bytes!';
  const PROD_TURNSTILE_SECRET = '0x4AAAAAAATurnstileProdSecretTestKey';
  const AUTHORIZED_ADMIN = 'ops-lead@qroute.production';
  const UNAUTHORIZED_ADMIN = 'intruder@external-org.test';

  const PROD_ACTIVE_PUBLIC_ID = 'PRD87K2M9Q4X8P6V';
  const PROD_ACTIVE_CARD_ID = 'c_prod_actv_01';
  const PROD_UNAC_PUBLIC_ID = 'PRD15C8R2W7K9M4Q';
  const PROD_UNAC_CARD_ID = 'c_prod_unac_01';
  const PROD_UNAC_CODE = '7777-8888-9999';

  const DESTINATION_URL =
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';

  let originalFetch: typeof globalThis.fetch;

  beforeAll(async () => {
    (env as unknown as Env).ACTIVATION_SECRET = PROD_SECRET;

    // Apply exact production schema migration tables and indexes
    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS batches (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          card_count INTEGER NOT NULL CHECK (card_count > 0),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )`
    ).run();

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS businesses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          contact_email TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
          updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )`
    ).run();

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          public_id TEXT NOT NULL UNIQUE,
          batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
          business_id TEXT REFERENCES businesses(id) ON DELETE SET NULL,
          status TEXT NOT NULL DEFAULT 'UNACTIVATED' CHECK (status IN ('UNACTIVATED', 'ACTIVE', 'DISABLED', 'RETIRED')),
          activation_code_hash TEXT NOT NULL,
          code_rotation_counter INTEGER NOT NULL DEFAULT 0,
          business_name TEXT,
          destination_url TEXT,
          activated_at TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
          updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )`
    ).run();

    await env.DB.prepare(
      `CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
          action TEXT NOT NULL CHECK (action IN (
              'CARD_CREATED', 'CARD_ACTIVATED', 'DESTINATION_CHANGED',
              'CARD_DISABLED', 'CARD_RESTORED', 'CARD_RETIRED'
          )),
          actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'PUBLIC', 'ADMIN')),
          actor_identifier TEXT NOT NULL,
          previous_state TEXT,
          new_state TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )`
    ).run();

    // Create production indexes
    await env.DB.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id)'
    ).run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_cards_batch_id ON cards(batch_id)').run();
    await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status)').run();
    await env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_card_id ON audit_logs(card_id)'
    ).run();
    await env.DB.prepare(
      'CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)'
    ).run();

    // Insert a batch
    await env.DB.prepare(
      `INSERT OR REPLACE INTO batches (id, name, card_count) VALUES ('batch_prod_01', 'Production Launch Batch', 2)`
    ).run();

    // Insert active card
    const dummyHash = await hashActivationCode('1111-2222-3333', PROD_SECRET);
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (
          id, public_id, batch_id, status, activation_code_hash, business_name, destination_url, activated_at
       ) VALUES (?, ?, 'batch_prod_01', 'ACTIVE', ?, 'Grand Bistro', ?, '2026-10-01T10:00:00.000Z')`
    )
      .bind(PROD_ACTIVE_CARD_ID, PROD_ACTIVE_PUBLIC_ID, dummyHash, DESTINATION_URL)
      .run();

    // Insert unactivated card
    const unacHash = await hashActivationCode(PROD_UNAC_CODE, PROD_SECRET);
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (
          id, public_id, batch_id, status, activation_code_hash
       ) VALUES (?, ?, 'batch_prod_01', 'UNACTIVATED', ?)`
    )
      .bind(PROD_UNAC_CARD_ID, PROD_UNAC_PUBLIC_ID, unacHash)
      .run();
  });

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('1. Health Check Endpoint (/healthz)', () => {
    it('returns ok status and reflects production environment when configured', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
      };
      const res = await app.request('/healthz', {}, prodEnv);
      expect(res.status).toBe(200);
      const json = await res.json<{ status: string; environment: string }>();
      expect(json.status).toBe('ok');
      expect(json.environment).toBe('production');
    });
  });

  describe('2. Multi-Hostname Resilience & Co-Existence Invariant', () => {
    it('resolves active card identically across Custom Domain and workers.dev pilot domain', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
      };

      // 1. Scan via Owned Custom Domain
      const customDomainRes = await app.request(
        `https://qr.yourbrand.com/c/${PROD_ACTIVE_PUBLIC_ID}`,
        { headers: { Host: 'qr.yourbrand.com' } },
        prodEnv
      );
      expect(customDomainRes.status).toBe(302);
      expect(customDomainRes.headers.get('Location')).toBe(DESTINATION_URL);
      expect(customDomainRes.headers.get('Cache-Control')).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
      expect(customDomainRes.headers.get('Referrer-Policy')).toBe('no-referrer');
      expect(customDomainRes.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(customDomainRes.headers.get('X-Frame-Options')).toBe('DENY');

      // 2. Scan via workers.dev pilot domain
      const workersDevRes = await app.request(
        `https://go.taprevieww.workers.dev/c/${PROD_ACTIVE_PUBLIC_ID}`,
        { headers: { Host: 'go.taprevieww.workers.dev' } },
        prodEnv
      );
      expect(workersDevRes.status).toBe(302);
      expect(workersDevRes.headers.get('Location')).toBe(DESTINATION_URL);
      expect(workersDevRes.headers.get('Cache-Control')).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
      expect(workersDevRes.headers.get('Referrer-Policy')).toBe('no-referrer');

      // 3. Scan via localhost / edge runtime
      const localRes = await app.request(
        `http://localhost:8787/c/${PROD_ACTIVE_PUBLIC_ID}`,
        {},
        prodEnv
      );
      expect(localRes.status).toBe(302);
      expect(localRes.headers.get('Location')).toBe(DESTINATION_URL);
    });

    it('preserves relative activation URL on unactivated card regardless of hostname', async () => {
      const prodEnv: Env = { ...env, ENVIRONMENT: 'production' };

      const res = await app.request(
        `https://qr.yourbrand.com/c/${PROD_UNAC_PUBLIC_ID}`,
        { headers: { Host: 'qr.yourbrand.com' } },
        prodEnv
      );
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe(`/activate/${PROD_UNAC_PUBLIC_ID}`);
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
    });

    it('verifies redirect path uses covering index without table scan', async () => {
      // Execute EXPLAIN QUERY PLAN in SQLite to prove indexed point lookup
      const plan = await env.DB.prepare(
        'EXPLAIN QUERY PLAN SELECT status, destination_url FROM cards WHERE public_id = ?'
      )
        .bind(PROD_ACTIVE_PUBLIC_ID)
        .all<{ detail: string }>();

      const planDetails = plan.results.map((r) => r.detail).join(' ');
      // Must indicate USING INDEX idx_cards_public_id or USING COVERING INDEX
      expect(planDetails.toLowerCase()).toContain('idx_cards_public_id');
    });
  });

  describe('3. Cloudflare Access Zero Trust Production Enforcement', () => {
    it('strictly IGNORES x-admin-email dev bypass header in production environment', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
      };

      // Attacker or developer trying to use dev bypass header in production
      const res = await app.request(
        '/api/admin/dashboard',
        {
          headers: {
            'x-admin-email': AUTHORIZED_ADMIN,
          },
        },
        prodEnv
      );

      // Must reject with 401 Unauthorized because cf-access header is missing
      expect(res.status).toBe(401);
      const json = await res.json<{ success: boolean; error: { code: string; message: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
      expect(json.error.message).toContain('Cloudflare Access authentication required');
    });

    it('accepts legitimate cf-access-authenticated-user-email header in production', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
      };

      const res = await app.request(
        '/api/admin/dashboard',
        {
          headers: {
            'cf-access-authenticated-user-email': AUTHORIZED_ADMIN,
          },
        },
        prodEnv
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: { totalCards: number; activeCards: number };
      }>();
      expect(json.success).toBe(true);
      expect(json.data.totalCards).toBeDefined();
    });

    it('enforces ADMIN_ALLOWED_EMAILS allowlist in production', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
        ADMIN_ALLOWED_EMAILS: AUTHORIZED_ADMIN,
      };

      // Unauthorized operator through Cloudflare Access
      const res = await app.request(
        '/api/admin/dashboard',
        {
          headers: {
            'cf-access-authenticated-user-email': UNAUTHORIZED_ADMIN,
          },
        },
        prodEnv
      );

      expect(res.status).toBe(403);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('4. Turnstile Bot Defense Strict Production Enforcement', () => {
    it('fails closed (500) in production if TURNSTILE_SECRET_KEY is missing from environment', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
        ACTIVATION_SECRET: PROD_SECRET,
        // TURNSTILE_SECRET_KEY is intentionally undefined
      };

      const payload = {
        publicId: PROD_UNAC_PUBLIC_ID,
        businessName: 'Cafe Verona',
        reviewUrl: DESTINATION_URL,
        activationCode: PROD_UNAC_CODE,
        turnstileToken: 'dummy-token',
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        prodEnv
      );

      expect(res.status).toBe(500);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CONFIGURATION_ERROR');

      // Card remains UNACTIVATED
      const card = await env.DB.prepare('SELECT status FROM cards WHERE public_id = ?')
        .bind(PROD_UNAC_PUBLIC_ID)
        .first<{ status: string }>();
      expect(card?.status).toBe('UNACTIVATED');
    });

    it('rejects activation with 403 in production if turnstileToken is missing', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
        ACTIVATION_SECRET: PROD_SECRET,
        TURNSTILE_SECRET_KEY: PROD_TURNSTILE_SECRET,
      };

      const payload = {
        publicId: PROD_UNAC_PUBLIC_ID,
        businessName: 'Cafe Verona',
        reviewUrl: DESTINATION_URL,
        activationCode: PROD_UNAC_CODE,
        // turnstileToken missing
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        prodEnv
      );

      expect(res.status).toBe(403);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('TURNSTILE_FAILED');
    });

    it('rejects activation with 403 in production if Turnstile challenge fails', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
        ACTIVATION_SECRET: PROD_SECRET,
        TURNSTILE_SECRET_KEY: PROD_TURNSTILE_SECRET,
      };

      // Mock Cloudflare siteverify endpoint returning challenge failure
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
      } as Response);

      const payload = {
        publicId: PROD_UNAC_PUBLIC_ID,
        businessName: 'Cafe Verona',
        reviewUrl: DESTINATION_URL,
        activationCode: PROD_UNAC_CODE,
        turnstileToken: 'failed-challenge-token',
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        prodEnv
      );

      expect(res.status).toBe(403);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('TURNSTILE_FAILED');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        expect.anything()
      );
    });

    it('successfully activates card in production when Turnstile challenge succeeds', async () => {
      const prodEnv: Env = {
        ...env,
        ENVIRONMENT: 'production',
        ACTIVATION_SECRET: PROD_SECRET,
        TURNSTILE_SECRET_KEY: PROD_TURNSTILE_SECRET,
      };

      // Mock Cloudflare siteverify endpoint returning success
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);

      const payload = {
        publicId: PROD_UNAC_PUBLIC_ID,
        businessName: 'Cafe Verona',
        reviewUrl: DESTINATION_URL,
        activationCode: PROD_UNAC_CODE,
        turnstileToken: 'legitimate-turnstile-token-from-cf',
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        prodEnv
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: { status: string; destinationUrl: string };
      }>();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('ACTIVE');
      expect(json.data.destinationUrl).toBe(DESTINATION_URL);

      // Verify card is now active in D1
      const card = await env.DB.prepare(
        'SELECT status, destination_url FROM cards WHERE public_id = ?'
      )
        .bind(PROD_UNAC_PUBLIC_ID)
        .first<{ status: string; destination_url: string }>();
      expect(card?.status).toBe('ACTIVE');
      expect(card?.destination_url).toBe(DESTINATION_URL);
    });
  });

  describe('5. Production Database Schema & Zero Dev Leak Verification', () => {
    it('verifies all 5 performance indexes are present in the database', async () => {
      const indexes = await env.DB.prepare(
        `SELECT name FROM sqlite_master WHERE type = 'index' AND name LIKE 'idx_%'`
      ).all<{ name: string }>();

      const indexNames = indexes.results.map((r) => r.name);
      expect(indexNames).toContain('idx_cards_public_id');
      expect(indexNames).toContain('idx_cards_batch_id');
      expect(indexNames).toContain('idx_cards_status');
      expect(indexNames).toContain('idx_audit_logs_card_id');
      expect(indexNames).toContain('idx_audit_logs_created_at');
    });

    it('verifies audit log entry was written on production activation', async () => {
      const auditLog = await env.DB.prepare(
        `SELECT action, actor_type, new_state FROM audit_logs WHERE card_id = ? AND action = 'CARD_ACTIVATED'`
      )
        .bind(PROD_UNAC_CARD_ID)
        .first<{ action: string; actor_type: string; new_state: string }>();

      expect(auditLog).toBeDefined();
      expect(auditLog?.action).toBe('CARD_ACTIVATED');
      expect(auditLog?.actor_type).toBe('PUBLIC');
      expect(auditLog?.new_state).toContain('Cafe Verona');
    });
  });
});
