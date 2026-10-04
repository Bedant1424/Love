import { describe, it, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';

describe('D1 Database Binding & SQLite Foundation', () => {
  beforeAll(async () => {
    // Apply initial test schema to in-memory D1 test database
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
  });

  it('verifies D1 binding is accessible', () => {
    expect(env.DB).toBeDefined();
    expect(typeof env.DB.prepare).toBe('function');
  });

  it('executes parameterized INSERT and SELECT on D1 binding', async () => {
    const batchId = 'batch_test_001';
    const batchName = 'Test Foundation Batch';
    const cardCount = 10;
    const notes = 'Automated D1 binding verification test';

    // 1. Parameterized INSERT
    const insertResult = await env.DB.prepare(
      'INSERT INTO batches (id, name, card_count, notes) VALUES (?, ?, ?, ?)'
    )
      .bind(batchId, batchName, cardCount, notes)
      .run();

    expect(insertResult.success).toBe(true);
    expect(insertResult.meta.changes).toBe(1);

    // 2. Parameterized SELECT point query
    const row = await env.DB.prepare('SELECT id, name, card_count, notes FROM batches WHERE id = ?')
      .bind(batchId)
      .first<{ id: string; name: string; card_count: number; notes: string }>();

    expect(row).toBeDefined();
    expect(row?.id).toBe(batchId);
    expect(row?.name).toBe(batchName);
    expect(row?.card_count).toBe(cardCount);
    expect(row?.notes).toBe(notes);
  });

  it('proves indexed point lookup on cards table', async () => {
    const cardId = 'card_test_001';
    const publicId = 'A7K92P4X8Q6M3V5N';
    const batchId = 'batch_test_001';
    const codeHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

    await env.DB.prepare(
      'INSERT INTO cards (id, public_id, batch_id, status, activation_code_hash) VALUES (?, ?, ?, ?, ?)'
    )
      .bind(cardId, publicId, batchId, 'UNACTIVATED', codeHash)
      .run();

    // Query exclusively by indexed public_id (Prime Redirect Invariant)
    const card = await env.DB.prepare(
      'SELECT public_id, status, destination_url FROM cards WHERE public_id = ?'
    )
      .bind(publicId)
      .first<{ public_id: string; status: string; destination_url: string | null }>();

    expect(card).toBeDefined();
    expect(card?.public_id).toBe(publicId);
    expect(card?.status).toBe('UNACTIVATED');
    expect(card?.destination_url).toBeNull();
  });
});
