import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import type { Env } from '../../src/server/types';
import app from '../../src/server/index';
import { hashActivationCode } from '../../src/shared/activation-crypto';

describe('Admin Operations, Lifecycle & Provisioning Engine (/api/admin/*)', () => {
  const TEST_SECRET = 'admin_integration_test_secret_32bytes_minimum!';
  const ADMIN_EMAIL = 'superadmin@qroute.internal';

  const ACTIVE_CARD_ID = 'ACTV_ADMIN_01';
  const ACTIVE_PUBLIC_ID = 'ACTV7K2M9Q4X8P6V';
  const UNACTIVATED_CARD_ID = 'PEND_ADMIN_01';
  const UNACTIVATED_PUBLIC_ID = 'PEND7K2M9Q4X8P6V';
  const DISABLED_CARD_ID = 'DACT_ADMIN_01';
  const DISABLED_PUBLIC_ID = 'DACT7K2M9Q4X8P6V';

  const INITIAL_GOOGLE_URL =
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';
  const UPDATED_GOOGLE_URL = 'https://g.page/r/Cb7_EXAMPLE_REVIEW/review';

  beforeAll(async () => {
    // 1. Configure environment secret
    (env as unknown as Env).ACTIVATION_SECRET = TEST_SECRET;

    // 2. Initialize schema tables
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
      `CREATE TABLE IF NOT EXISTS cards (
          id TEXT PRIMARY KEY,
          public_id TEXT NOT NULL UNIQUE,
          batch_id TEXT NOT NULL REFERENCES batches(id) ON DELETE RESTRICT,
          business_id TEXT,
          status TEXT NOT NULL DEFAULT 'UNACTIVATED',
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
          action TEXT NOT NULL,
          actor_type TEXT NOT NULL,
          actor_identifier TEXT NOT NULL,
          previous_state TEXT,
          new_state TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )`
    ).run();

    await env.DB.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id)'
    ).run();

    // 3. Seed initial batch and test cards
    const batchId = 'batch_admin_ops';
    await env.DB.prepare(
      'INSERT OR IGNORE INTO batches (id, name, card_count, notes) VALUES (?, ?, ?, ?)'
    )
      .bind(batchId, 'Admin Operations Test Batch', 3, 'Initial test fleet')
      .run();

    const dummyHash = await hashActivationCode('K7XM-92PR-V8Q2', TEST_SECRET);

    // Active Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url, activated_at)
       VALUES (?, ?, ?, 'ACTIVE', ?, 'Alpha Coffee', ?, '2026-10-01T12:00:00.000Z')`
    )
      .bind(ACTIVE_CARD_ID, ACTIVE_PUBLIC_ID, batchId, dummyHash, INITIAL_GOOGLE_URL)
      .run();

    // Unactivated Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
       VALUES (?, ?, ?, 'UNACTIVATED', ?)`
    )
      .bind(UNACTIVATED_CARD_ID, UNACTIVATED_PUBLIC_ID, batchId, dummyHash)
      .run();

    // Disabled Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
       VALUES (?, ?, ?, 'DISABLED', ?, 'Beta Bakery', ?)`
    )
      .bind(DISABLED_CARD_ID, DISABLED_PUBLIC_ID, batchId, dummyHash, INITIAL_GOOGLE_URL)
      .run();
  });

  describe('1. Authentication & Security Boundary', () => {
    it('rejects unauthenticated requests with HTTP 401 Unauthorized', async () => {
      const res = await app.request('/api/admin/dashboard', {}, env);
      expect(res.status).toBe(401);

      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('rejects requests with malformed or invalid identity email with HTTP 401', async () => {
      const res = await app.request(
        '/api/admin/dashboard',
        {
          headers: { 'cf-access-authenticated-user-email': 'not-an-email' },
        },
        env
      );
      expect(res.status).toBe(401);
    });

    it('grants access when authenticated via Cloudflare Access identity header', async () => {
      const res = await app.request(
        '/api/admin/dashboard',
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );
      expect(res.status).toBe(200);

      const json = await res.json<{
        success: boolean;
        data: { totalCards: number; totalBatches: number };
      }>();
      expect(json.success).toBe(true);
      expect(json.data.totalCards).toBeGreaterThanOrEqual(3);
      expect(json.data.totalBatches).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Card Inventory & Filtering (GET /api/admin/cards)', () => {
    it('returns paginated cards list without leaking activation code hashes', async () => {
      const res = await app.request(
        '/api/admin/cards?page=1&limit=10',
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: {
          items: Array<Record<string, unknown>>;
          pagination: { page: number; limit: number; total: number };
        };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.items.length).toBeGreaterThanOrEqual(3);
      expect(json.data.pagination.page).toBe(1);

      // Verify zero secret leakage
      for (const card of json.data.items) {
        expect(card.activation_code_hash).toBeUndefined();
        expect(card.activationCodeHash).toBeUndefined();
        expect(card.activationCode).toBeUndefined();
      }
    });

    it('filters cards by lifecycle status', async () => {
      const res = await app.request(
        '/api/admin/cards?status=ACTIVE',
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: { items: Array<{ status: string }> };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.items.every((c) => c.status === 'ACTIVE')).toBe(true);
    });

    it('searches cards by public ID', async () => {
      const res = await app.request(
        `/api/admin/cards?search=${ACTIVE_PUBLIC_ID}`,
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: { items: Array<{ publicId: string }> };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.items.length).toBe(1);
      expect(json.data.items[0]?.publicId).toBe(ACTIVE_PUBLIC_ID);
    });
  });

  describe('3. Card Detail & Audit Timeline (GET /api/admin/cards/:id)', () => {
    it('returns card operational detail with audit logs history', async () => {
      const res = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}`,
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: { id: string; publicId: string; status: string; auditLogs: unknown[] };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.id).toBe(ACTIVE_CARD_ID);
      expect(json.data.publicId).toBe(ACTIVE_PUBLIC_ID);
      expect(json.data.status).toBe('ACTIVE');
      expect(Array.isArray(json.data.auditLogs)).toBe(true);
    });

    it('returns 404 for non-existent card', async () => {
      const res = await app.request(
        '/api/admin/cards/card_does_not_exist',
        {
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(404);
    });
  });

  describe('4. Batch Creation & Card Provisioning (POST /api/admin/batches)', () => {
    it('provisions new batch of cards and returns one-time activation codes without storing plaintext in D1', async () => {
      const payload = {
        name: 'Spring 2026 Fleet',
        cardCount: 4,
        notes: 'Print proof batch for matte PVC production',
      };

      const res = await app.request(
        '/api/admin/batches',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-access-authenticated-user-email': ADMIN_EMAIL,
          },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(201);
      const json = await res.json<{
        success: boolean;
        data: {
          batch: { id: string; name: string; cardCount: number };
          cards: Array<{ id: string; publicId: string; activationCode: string; nfcUrl: string }>;
        };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.batch.name).toBe('Spring 2026 Fleet');
      expect(json.data.batch.cardCount).toBe(4);
      expect(json.data.cards).toHaveLength(4);

      // Verify each generated card has valid format
      for (const card of json.data.cards) {
        expect(card.publicId).toHaveLength(16);
        expect(card.activationCode).toMatch(
          /^[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/
        );
        expect(card.nfcUrl).toContain(`/c/${card.publicId}`);

        // Direct database inspection: verify PLAINTEXT code is NOT in D1!
        const d1Card = await env.DB.prepare('SELECT activation_code_hash FROM cards WHERE id = ?')
          .bind(card.id)
          .first<{ activation_code_hash: string }>();

        expect(d1Card).toBeDefined();
        // Stored hash must be 64-char lowercase hex digest
        expect(d1Card?.activation_code_hash).toMatch(/^[0-9a-f]{64}$/);
        // It must NOT equal the raw code
        expect(d1Card?.activation_code_hash).not.toBe(card.activationCode);
      }

      // Check audit_logs has CARD_CREATED entries
      const auditCount = await env.DB.prepare(
        "SELECT count(*) as count FROM audit_logs WHERE action = 'CARD_CREATED' AND actor_identifier = ?"
      )
        .bind(ADMIN_EMAIL)
        .first<{ count: number }>();

      expect(auditCount?.count).toBeGreaterThanOrEqual(4);
    });

    it('rejects batch creation with invalid count or missing name', async () => {
      const res = await app.request(
        '/api/admin/batches',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-access-authenticated-user-email': ADMIN_EMAIL,
          },
          body: JSON.stringify({ name: '', cardCount: 0 }),
        },
        env
      );

      expect(res.status).toBe(400);
    });
  });

  describe('5. Card Lifecycle Operations', () => {
    it('disables an ACTIVE card (ACTIVE -> DISABLED) and records CARD_DISABLED audit log', async () => {
      const res = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/disable`,
        {
          method: 'POST',
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{ success: boolean; data: { status: string } }>();
      expect(json.data.status).toBe('DISABLED');

      // Verify in D1
      const d1Card = await env.DB.prepare('SELECT status FROM cards WHERE id = ?')
        .bind(ACTIVE_CARD_ID)
        .first<{ status: string }>();
      expect(d1Card?.status).toBe('DISABLED');

      // Verify audit log
      const auditLog = await env.DB.prepare(
        "SELECT action, actor_identifier FROM audit_logs WHERE card_id = ? AND action = 'CARD_DISABLED'"
      )
        .bind(ACTIVE_CARD_ID)
        .first<{ action: string; actor_identifier: string }>();
      expect(auditLog?.action).toBe('CARD_DISABLED');
      expect(auditLog?.actor_identifier).toBe(ADMIN_EMAIL);

      // REDIRECT INVARIANT CHECK:
      // Verify GET /c/:publicId now serves clean 200 disabled notice without redirecting!
      const redirectRes = await app.request(`/c/${ACTIVE_PUBLIC_ID}`, {}, env);
      expect(redirectRes.status).toBe(200);
      const html = await redirectRes.text();
      expect(html).toContain('Temporarily Inactive');
    });

    it('restores a DISABLED card (DISABLED -> ACTIVE) and records CARD_RESTORED audit log', async () => {
      const res = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/restore`,
        {
          method: 'POST',
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{ success: boolean; data: { status: string } }>();
      expect(json.data.status).toBe('ACTIVE');

      // REDIRECT INVARIANT CHECK:
      // Verify GET /c/:publicId now immediately resumes 302 Found redirect!
      const redirectRes = await app.request(`/c/${ACTIVE_PUBLIC_ID}`, {}, env);
      expect(redirectRes.status).toBe(302);
      expect(redirectRes.headers.get('Location')).toBe(INITIAL_GOOGLE_URL);
    });

    it('updates destination URL on an ACTIVE card (DESTINATION_CHANGED)', async () => {
      const res = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/change-destination`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'cf-access-authenticated-user-email': ADMIN_EMAIL,
          },
          body: JSON.stringify({ destinationUrl: UPDATED_GOOGLE_URL }),
        },
        env
      );

      expect(res.status).toBe(200);

      // Verify redirect target changed immediately
      const redirectRes = await app.request(`/c/${ACTIVE_PUBLIC_ID}`, {}, env);
      expect(redirectRes.status).toBe(302);
      expect(redirectRes.headers.get('Location')).toBe(UPDATED_GOOGLE_URL);
    });

    it('retires a card permanently (* -> RETIRED) and blocks subsequent restoration', async () => {
      const res = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/retire`,
        {
          method: 'POST',
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{ success: boolean; data: { status: string } }>();
      expect(json.data.status).toBe('RETIRED');

      // Attempting to restore or disable retired card must fail!
      const restoreRes = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/restore`,
        {
          method: 'POST',
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );
      expect(restoreRes.status).toBe(400);

      // Attempting to retire already retired card must fail!
      const reRetireRes = await app.request(
        `/api/admin/cards/${ACTIVE_CARD_ID}/retire`,
        {
          method: 'POST',
          headers: { 'cf-access-authenticated-user-email': ADMIN_EMAIL },
        },
        env
      );
      expect(reRetireRes.status).toBe(400);

      // REDIRECT INVARIANT CHECK:
      // Verify GET /c/:publicId now serves clean 200 retired notice!
      const redirectRes = await app.request(`/c/${ACTIVE_PUBLIC_ID}`, {}, env);
      expect(redirectRes.status).toBe(200);
      const html = await redirectRes.text();
      expect(html).toContain('Card Retired');
      expect(html).toContain('This card has been retired from service.');
    });
  });

  describe('6. Public Redirect Invariant Regression Test', () => {
    it('customer scan redirect GET /c/:publicId remains unauthenticated, does zero writes and zero fetches', async () => {
      // 1. Seed brand new active card
      const regressionPublicId = 'REGR7K2M9Q4X8P6V';
      const regressionDest =
        'https://search.google.com/local/writereview?placeid=ChIJ_REGRESSION_ACTIVE';
      const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000';

      await env.DB.prepare(
        `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, destination_url)
         VALUES ('c_regr_01', ?, 'batch_admin_ops', 'ACTIVE', ?, ?)`
      )
        .bind(regressionPublicId, dummyHash, regressionDest)
        .run();

      // 2. Perform public customer scan with ZERO admin headers
      const res = await app.request(`/c/${regressionPublicId}`, {}, env);

      // Invariant assertions:
      expect(res.status).toBe(302);
      expect(res.headers.get('Location')).toBe(regressionDest);
      expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
      expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
    });
  });
});
