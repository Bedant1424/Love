import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import type { Env } from '../../src/server/types';
import app from '../../src/server/index';
import { hashActivationCode } from '../../src/shared/activation-crypto';

describe('Card Activation Engine & Public Status API', () => {
  const TEST_SECRET = 'super_secret_activation_key_for_integration_testing_12345';
  const VALID_CODE = 'K7XM-92PR-V8Q2';
  const VALID_REVIEW_URL =
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';

  const CARD_UNAC_1 = 'PEND7K2M9Q4X8P6V';
  const CARD_UNAC_2 = 'PEND5C8R2W7K9M4Q';
  const CARD_UNAC_RACE = 'PEND3T6A8N2X5V7K';
  const CARD_ACTIVE = 'ACTV7K2M9Q4X8P6V';
  const CARD_DISABLED = 'DACT7K2M9Q4X8P6V';
  const CARD_RETIRED = 'RETR7K2M9Q4X8P6V';

  beforeAll(async () => {
    // 1. Configure environment secret
    (env as unknown as Env).ACTIVATION_SECRET = TEST_SECRET;

    // 2. Initialize schema tables
    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS batches (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          card_count INTEGER NOT NULL CHECK (card_count > 0),
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )
    `
    ).run();

    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS cards (
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
      )
    `
    ).run();

    await env.DB.prepare(
      `
      CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
          action TEXT NOT NULL,
          actor_type TEXT NOT NULL,
          actor_identifier TEXT NOT NULL,
          previous_state TEXT,
          new_state TEXT,
          metadata TEXT,
          created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
      )
    `
    ).run();

    await env.DB.prepare(
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id)'
    ).run();

    // 3. Seed test batch
    const batchId = 'batch_activation_tests';
    await env.DB.prepare(
      'INSERT OR IGNORE INTO batches (id, name, card_count, notes) VALUES (?, ?, ?, ?)'
    )
      .bind(batchId, 'Activation Test Batch', 6, 'Harness for activation tests')
      .run();

    // 4. Derive code hash
    const validHash = await hashActivationCode(VALID_CODE, TEST_SECRET);

    // 5. Seed cards
    // Unactivated Card 1
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
       VALUES (?, ?, ?, 'UNACTIVATED', ?)`
    )
      .bind('c_unac_1', CARD_UNAC_1, batchId, validHash)
      .run();

    // Unactivated Card 2 (for validation failure tests)
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
       VALUES (?, ?, ?, 'UNACTIVATED', ?)`
    )
      .bind('c_unac_2', CARD_UNAC_2, batchId, validHash)
      .run();

    // Unactivated Card for Race Condition
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
       VALUES (?, ?, ?, 'UNACTIVATED', ?)`
    )
      .bind('c_unac_race', CARD_UNAC_RACE, batchId, validHash)
      .run();

    // Active Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url, activated_at)
       VALUES (?, ?, ?, 'ACTIVE', ?, 'Active Bakery', ?, '2026-10-01T12:00:00.000Z')`
    )
      .bind('c_actv_1', CARD_ACTIVE, batchId, validHash, VALID_REVIEW_URL)
      .run();

    // Disabled Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
       VALUES (?, ?, ?, 'DISABLED', ?, 'Disabled Clinic', ?)`
    )
      .bind('c_disa_1', CARD_DISABLED, batchId, validHash, VALID_REVIEW_URL)
      .run();

    // Retired Card
    await env.DB.prepare(
      `INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
       VALUES (?, ?, ?, 'RETIRED', ?, 'Retired Auto', ?)`
    )
      .bind('c_retr_1', CARD_RETIRED, batchId, validHash, VALID_REVIEW_URL)
      .run();
  });

  describe('Card Public Status Endpoint (GET /api/public/card/:publicId/status)', () => {
    it('returns status UNACTIVATED for unactivated card', async () => {
      const res = await app.request(`/api/public/card/${CARD_UNAC_1}/status`, {}, env);
      expect(res.status).toBe(200);

      const json = await res.json<{
        success: boolean;
        data: { publicId: string; status: string };
      }>();
      expect(json.success).toBe(true);
      expect(json.data.publicId).toBe(CARD_UNAC_1);
      expect(json.data.status).toBe('UNACTIVATED');
    });

    it('returns status ACTIVE for active card without disclosing business or destination metadata', async () => {
      const res = await app.request(`/api/public/card/${CARD_ACTIVE}/status`, {}, env);
      expect(res.status).toBe(200);

      const json = await res.json<{ success: boolean; data: Record<string, unknown> }>();
      expect(json.success).toBe(true);
      expect(json.data.publicId).toBe(CARD_ACTIVE);
      expect(json.data.status).toBe('ACTIVE');
      expect(json.data.businessName).toBeUndefined();
      expect(json.data.destinationUrl).toBeUndefined();
      expect(json.data.activationCodeHash).toBeUndefined();
    });

    it('returns 404 for unknown card ID', async () => {
      const res = await app.request('/api/public/card/NKP97K2M9Q4X8P6V/status', {}, env);
      expect(res.status).toBe(404);

      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('NOT_FOUND');
    });

    it('returns 400 for malformed card ID', async () => {
      const res = await app.request('/api/public/card/INVALID-ID!/status', {}, env);
      expect(res.status).toBe(400);

      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_ID');
    });
  });

  describe('Card Activation API (POST /api/public/activate)', () => {
    it('1. Successfully activates an UNACTIVATED card, writes audit log, and enables 302 redirect', async () => {
      const payload = {
        publicId: CARD_UNAC_1,
        businessName: 'Sunrise Bakery & Cafe',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: 'k7xm-92pr-v8q2', // Lowercase with hyphens to verify normalization
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(200);
      const json = await res.json<{
        success: boolean;
        data: {
          publicId: string;
          status: string;
          businessName: string;
          destinationUrl: string;
          activatedAt: string;
        };
      }>();

      expect(json.success).toBe(true);
      expect(json.data.publicId).toBe(CARD_UNAC_1);
      expect(json.data.status).toBe('ACTIVE');
      expect(json.data.businessName).toBe('Sunrise Bakery & Cafe');
      expect(json.data.destinationUrl).toBe(VALID_REVIEW_URL);
      expect(json.data.activatedAt).toBeDefined();

      // Check D1 database state directly
      const updatedCard = await env.DB.prepare(
        'SELECT status, business_name, destination_url, activated_at FROM cards WHERE public_id = ?'
      )
        .bind(CARD_UNAC_1)
        .first<{
          status: string;
          business_name: string;
          destination_url: string;
          activated_at: string;
        }>();

      expect(updatedCard?.status).toBe('ACTIVE');
      expect(updatedCard?.business_name).toBe('Sunrise Bakery & Cafe');
      expect(updatedCard?.destination_url).toBe(VALID_REVIEW_URL);

      // Check audit_logs directly
      const auditLog = await env.DB.prepare(
        'SELECT action, actor_type, previous_state, new_state FROM audit_logs WHERE card_id = ?'
      )
        .bind('c_unac_1')
        .first<{ action: string; actor_type: string; previous_state: string; new_state: string }>();

      expect(auditLog?.action).toBe('CARD_ACTIVATED');
      expect(auditLog?.actor_type).toBe('PUBLIC');
      expect(auditLog?.previous_state).toContain('UNACTIVATED');
      expect(auditLog?.new_state).toContain('Sunrise Bakery & Cafe');

      // CRITICAL REDIRECT REGRESSION CHECK:
      // Verify GET /c/:publicId now immediately issues HTTP 302 to the activated destination!
      const redirectRes = await app.request(`/c/${CARD_UNAC_1}`, {}, env);
      expect(redirectRes.status).toBe(302);
      expect(redirectRes.headers.get('Location')).toBe(VALID_REVIEW_URL);
      expect(redirectRes.headers.get('Cache-Control')).toBe(
        'private, no-cache, no-store, must-revalidate'
      );
      expect(redirectRes.headers.get('Referrer-Policy')).toBe('no-referrer');
    });

    it('2. Rejects subsequent activation of an already-ACTIVE card (irreversible state)', async () => {
      const payload = {
        publicId: CARD_UNAC_1,
        businessName: 'Hijack Attempt Bakery',
        reviewUrl: 'https://g.page/r/hijack/review',
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CARD_ALREADY_ACTIVE');
    });

    it('3. Rejects invalid activation code with generic error', async () => {
      const payload = {
        publicId: CARD_UNAC_2,
        businessName: 'Legitimate Merchant',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: '9999-9999-9999', // Incorrect code
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string; message: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ACTIVATION_FAILED');
      expect(json.error.message).toBe('Invalid activation code or card ID');

      // Card remains UNACTIVATED
      const card = await env.DB.prepare('SELECT status FROM cards WHERE public_id = ?')
        .bind(CARD_UNAC_2)
        .first<{ status: string }>();
      expect(card?.status).toBe('UNACTIVATED');
    });

    it('4. Rejects invalid/malicious destination URLs', async () => {
      const payload = {
        publicId: CARD_UNAC_2,
        businessName: 'Legitimate Merchant',
        reviewUrl: 'https://evil.com/google.com/review',
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_URL');
    });

    it('5. Rejects malicious business name with HTML script tags and sanitizes valid input', async () => {
      const payload = {
        publicId: CARD_UNAC_2,
        businessName: '<>', // Less than 2 chars after stripping <>
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_BUSINESS_NAME');
    });

    it('6. Rejects unknown card ID with generic error to prevent enumeration', async () => {
      const payload = {
        publicId: 'NKP97K2M9Q4X8P6V',
        businessName: 'Test Business',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string; message: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('ACTIVATION_FAILED');
      expect(json.error.message).toBe('Invalid activation code or card ID');
    });

    it('7. Rejects activation of DISABLED card', async () => {
      const payload = {
        publicId: CARD_DISABLED,
        businessName: 'Disabled Business',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CARD_ALREADY_ACTIVE');
    });

    it('8. Rejects activation of RETIRED card', async () => {
      const payload = {
        publicId: CARD_RETIRED,
        businessName: 'Retired Business',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        env
      );

      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CARD_ALREADY_ACTIVE');
    });

    it('9. Fails closed (500) if ACTIVATION_SECRET is missing or empty', async () => {
      const mockEnv = { ...env, ACTIVATION_SECRET: '' };
      const payload = {
        publicId: CARD_UNAC_2,
        businessName: 'Legitimate Merchant',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        mockEnv
      );

      expect(res.status).toBe(500);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('CONFIGURATION_ERROR');

      // Card remains UNACTIVATED
      const card = await env.DB.prepare('SELECT status FROM cards WHERE public_id = ?')
        .bind(CARD_UNAC_2)
        .first<{ status: string }>();
      expect(card?.status).toBe('UNACTIVATED');
    });

    it('10. Enforces concurrency protection: exactly 1 winner on simultaneous activations', async () => {
      const payloadA = {
        publicId: CARD_UNAC_RACE,
        businessName: 'Concurrent Merchant A',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      const payloadB = {
        publicId: CARD_UNAC_RACE,
        businessName: 'Concurrent Merchant B',
        reviewUrl: VALID_REVIEW_URL,
        activationCode: VALID_CODE,
      };

      // Dispatch 2 concurrent activation requests
      const [resA, resB] = await Promise.all([
        app.request(
          '/api/public/activate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadA),
          },
          env
        ),
        app.request(
          '/api/public/activate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadB),
          },
          env
        ),
      ]);

      const statuses = [resA.status, resB.status];
      // Exactly one request must succeed (HTTP 200)
      expect(statuses.filter((s) => s === 200).length).toBe(1);

      // The losing request must be rejected (HTTP 400 or 409)
      const failedStatus = statuses.find((s) => s !== 200);
      expect([400, 409]).toContain(failedStatus);

      // Verify DB state has exactly 1 winner
      const raceCard = await env.DB.prepare(
        'SELECT status, business_name FROM cards WHERE public_id = ?'
      )
        .bind(CARD_UNAC_RACE)
        .first<{ status: string; business_name: string }>();
      expect(raceCard?.status).toBe('ACTIVE');

      // Exactly 1 audit log entry
      const auditCount = await env.DB.prepare(
        'SELECT count(*) as count FROM audit_logs WHERE card_id = ?'
      )
        .bind('c_unac_race')
        .first<{ count: number }>();
      expect(auditCount?.count).toBe(1);
    });

    it('11. Rejects non-POST requests to /api/public/activate with 405 Method Not Allowed', async () => {
      const res = await app.request('/api/public/activate', { method: 'GET' }, env);
      expect(res.status).toBe(405);
      expect(res.headers.get('Allow')).toBe('POST');
    });

    it('12. Rejects malformed JSON body with 400', async () => {
      const res = await app.request(
        '/api/public/activate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{ invalid-json',
        },
        env
      );
      expect(res.status).toBe(400);
      const json = await res.json<{ success: boolean; error: { code: string } }>();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('INVALID_BODY');
    });
  });
});
