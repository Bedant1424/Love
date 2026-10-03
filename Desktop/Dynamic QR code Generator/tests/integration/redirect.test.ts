import { describe, it, expect, beforeAll, vi } from 'vitest';
import { env } from 'cloudflare:test';
import type { Env } from '../../src/server/types';
import app from '../../src/server/index';

describe('Public Card Redirect Engine (GET /c/:publicId)', () => {
  const ACTIVE_ID = 'ACTV999999';
  const ACTIVE_DESTINATION =
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';

  const UNACTIVATED_ID = 'PEND999999';
  const DISABLED_ID = 'DACT999999';
  const RETIRED_ID = 'RETR999999';

  beforeAll(async () => {
    // 1. Initialize schema
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
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id)'
    ).run();

    // 2. Insert test batch
    const batchId = 'batch_redirect_tests';
    await env.DB.prepare(
      'INSERT OR IGNORE INTO batches (id, name, card_count, notes) VALUES (?, ?, ?, ?)'
    )
      .bind(batchId, 'Redirect Test Batch', 4, 'Automated Redirect Test Harness')
      .run();

    // 3. Seed test cards
    const dummyHash = '0000000000000000000000000000000000000000000000000000000000000000';

    // ACTIVE card
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url, activated_at)
      VALUES (?, ?, ?, 'ACTIVE', ?, 'Dental Care Pilot', ?, '2026-10-01T12:00:00.000Z')
    `
    )
      .bind('card_actv_01', ACTIVE_ID, batchId, dummyHash, ACTIVE_DESTINATION)
      .run();

    // UNACTIVATED card
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
      VALUES (?, ?, ?, 'UNACTIVATED', ?)
    `
    )
      .bind('card_unac_01', UNACTIVATED_ID, batchId, dummyHash)
      .run();

    // DISABLED card
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
      VALUES (?, ?, ?, 'DISABLED', ?, 'Inactive Bakery', 'https://search.google.com/local/writereview?placeid=DisabledPlace')
    `
    )
      .bind('card_disa_01', DISABLED_ID, batchId, dummyHash)
      .run();

    // RETIRED card
    await env.DB.prepare(
      `
      INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
      VALUES (?, ?, ?, 'RETIRED', ?, 'Retired Store', 'https://search.google.com/local/writereview?placeid=RetiredPlace')
    `
    )
      .bind('card_retr_01', RETIRED_ID, batchId, dummyHash)
      .run();
  });

  it('1. ACTIVE card returns 302 Found with correct Location header', async () => {
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(ACTIVE_DESTINATION);
  });

  it('2. UNACTIVATED card returns 302 Found directing to /activate/:publicId', async () => {
    const req = new Request(`http://localhost/c/${UNACTIVATED_ID}`, { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(`/activate/${UNACTIVATED_ID}`);
  });

  it('3. DISABLED card returns 200 OK with maintenance message and does NOT redirect', async () => {
    const req = new Request(`http://localhost/c/${DISABLED_ID}`, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Location')).toBeNull();

    const body = await res.text();
    expect(body).toContain('Review Card Temporarily Inactive');
    expect(body).toContain('This review card is temporarily inactive. Please check back later.');
    // Invariant: Does not leak previous destination
    expect(body).not.toContain('DisabledPlace');
  });

  it('4. RETIRED card returns 200 OK with retired notice and does NOT redirect', async () => {
    const req = new Request(`http://localhost/c/${RETIRED_ID}`, {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(200);
    expect(res.headers.get('Location')).toBeNull();

    const body = await res.text();
    expect(body).toContain('Card Retired');
    expect(body).toContain('This card has been retired from service.');
    // Invariant: Does not leak previous destination
    expect(body).not.toContain('RetiredPlace');
  });

  it('5. UNKNOWN card returns generic 404 Not Found', async () => {
    const req = new Request('http://localhost/c/ZZZZ999999', {
      method: 'GET',
      headers: { Accept: 'text/html' },
    });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(404);
    expect(res.headers.get('Location')).toBeNull();

    const body = await res.text();
    expect(body).toContain('Card Not Found');
    expect(body).toContain(
      'Card not found. Please verify that you scanned an official review card.'
    );
  });

  it('6. Malformed public ID returns 404 without querying D1', async () => {
    const prepareSpy = vi.spyOn(env.DB, 'prepare');
    prepareSpy.mockClear();

    // Invalid length and contains forbidden character 'I'
    const req = new Request('http://localhost/c/INVALID_ID_TOO_LONG', { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(404);
    // Verified: No D1 prepare call executed on obviously malformed public ID
    expect(prepareSpy).not.toHaveBeenCalled();

    prepareSpy.mockRestore();
  });

  it('7. POST /c/:publicId is rejected with 405 Method Not Allowed', async () => {
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, {
      method: 'POST',
      body: JSON.stringify({ malicious: 'write' }),
    });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
  });

  it('8. Unexpected methods (PUT, DELETE, PATCH) return 405 with Allow header', async () => {
    for (const method of ['PUT', 'DELETE', 'PATCH']) {
      const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method });
      const res = await app.fetch(req, env);

      expect(res.status).toBe(405);
      expect(res.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
    }
  });

  it('9. HEAD /c/:publicId returns identical headers with empty body', async () => {
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'HEAD' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe(ACTIVE_DESTINATION);
    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');

    const body = await res.text();
    expect(body).toBe('');
  });

  it('10. OPTIONS /c/:publicId returns 204 No Content with Allow header', async () => {
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'OPTIONS' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(204);
    expect(res.headers.get('Allow')).toBe('GET, HEAD, OPTIONS');
  });

  it('11. Database failure returns safe 500 without leaking SQL errors or internals', async () => {
    // Construct mock DB that simulates a thrown SQLite error
    const brokenDb = {
      ...env.DB,
      prepare: vi.fn().mockImplementation(() => {
        throw new Error('SQLITE_BUSY: database is locked (D1 binding error internal)');
      }),
    };

    const brokenEnv = { ...env, DB: brokenDb as unknown as Env['DB'] };
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const res = await app.fetch(req, brokenEnv);

    expect(res.status).toBe(500);
    const body = await res.json<{ success: boolean; error: { code: string; message: string } }>();

    expect(body.success).toBe(false);
    expect(body.error.code).toBe('SERVER_ERROR');
    expect(body.error.message).toBe('The request could not be processed.');
    // Invariant: Zero leakage of database internals or SQLite error messages
    expect(JSON.stringify(body)).not.toContain('SQLITE');
    expect(JSON.stringify(body)).not.toContain('D1');
    expect(JSON.stringify(body)).not.toContain('database is locked');
  });

  it('12. Invariant: Destination is NOT fetched server-side (Zero SSRF)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(302);
    // Confirms Worker never initiates an outbound fetch to Google
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('13. CRITICAL INVARIANT: ACTIVE redirect does NOT perform D1 writes', async () => {
    // Snapshot database record before redirect
    const beforeRow = await env.DB.prepare(
      'SELECT id, public_id, status, destination_url, updated_at, code_rotation_counter FROM cards WHERE public_id = ?'
    )
      .bind(ACTIVE_ID)
      .first<{ updated_at: string; code_rotation_counter: number }>();

    // Spy on prepare to record exact SQL statement executed
    const prepareSpy = vi.spyOn(env.DB, 'prepare');
    prepareSpy.mockClear();

    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.status).toBe(302);

    // 1. Verify exactly ONE read query was executed
    expect(prepareSpy).toHaveBeenCalledTimes(1);
    const executedSql = prepareSpy.mock.calls[0]?.[0] as string;
    expect(executedSql).toBe('SELECT status, destination_url FROM cards WHERE public_id = ?');

    // 2. Verify no write queries were executed
    const forbiddenWriteKeywords = ['INSERT', 'UPDATE', 'DELETE', 'REPLACE', 'ALTER', 'DROP'];
    for (const keyword of forbiddenWriteKeywords) {
      expect(executedSql.toUpperCase()).not.toContain(keyword);
    }

    // 3. Verify observable state is 100% unchanged
    const afterRow = await env.DB.prepare(
      'SELECT id, public_id, status, destination_url, updated_at, code_rotation_counter FROM cards WHERE public_id = ?'
    )
      .bind(ACTIVE_ID)
      .first<{ updated_at: string; code_rotation_counter: number }>();

    expect(afterRow?.updated_at).toBe(beforeRow?.updated_at);
    expect(afterRow?.code_rotation_counter).toBe(beforeRow?.code_rotation_counter);

    prepareSpy.mockRestore();
  });

  it('14. Mandatory security & caching headers are emitted on responses', async () => {
    const req = new Request(`http://localhost/c/${ACTIVE_ID}`, { method: 'GET' });
    const res = await app.fetch(req, env);

    expect(res.headers.get('Cache-Control')).toBe('private, no-cache, no-store, must-revalidate');
    expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Permissions-Policy')).toBeDefined();
  });

  it('15. Destination URL is never leaked in non-ACTIVE states', async () => {
    // Check UNACTIVATED
    const resUnac = await app.fetch(
      new Request(`http://localhost/c/${UNACTIVATED_ID}`, { method: 'GET' }),
      env
    );
    const unacLoc = resUnac.headers.get('Location') ?? '';
    expect(unacLoc).not.toContain('google.com');

    // Check DISABLED
    const resDisa = await app.fetch(
      new Request(`http://localhost/c/${DISABLED_ID}`, { method: 'GET' }),
      env
    );
    const disaText = await resDisa.text();
    expect(disaText).not.toContain('google.com');
    expect(disaText).not.toContain('DisabledPlace');

    // Check RETIRED
    const resRetr = await app.fetch(
      new Request(`http://localhost/c/${RETIRED_ID}`, { method: 'GET' }),
      env
    );
    const retrText = await resRetr.text();
    expect(retrText).not.toContain('google.com');
    expect(retrText).not.toContain('RetiredPlace');
  });

  it('16. JSON Accept header returns structured response for API callers', async () => {
    const res = await app.fetch(
      new Request(`http://localhost/c/${DISABLED_ID}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
      env
    );

    expect(res.status).toBe(200);
    const json = await res.json<{ success: boolean; status: string }>();
    expect(json.success).toBe(true);
    expect(json.status).toBe('DISABLED');
  });
});
