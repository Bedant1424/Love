-- Migration: 0001_initial_schema.sql
-- Description: Core schema for batches, businesses, cards, and audit_logs

PRAGMA foreign_keys = ON;

-- 1. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    card_count INTEGER NOT NULL CHECK (card_count > 0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- 2. Businesses Table
CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact_email TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW')),
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- 3. Cards Table
CREATE TABLE IF NOT EXISTS cards (
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
);

-- 4. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK (action IN (
        'CARD_CREATED',
        'CARD_ACTIVATED',
        'DESTINATION_CHANGED',
        'CARD_DISABLED',
        'CARD_RESTORED',
        'CARD_RETIRED'
    )),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'PUBLIC', 'ADMIN')),
    actor_identifier TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

-- Performance Indexes (Indexed Point Queries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cards_public_id ON cards(public_id);
CREATE INDEX IF NOT EXISTS idx_cards_batch_id ON cards(batch_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_card_id ON audit_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
