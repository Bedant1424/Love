-- Forward migration: Add 'CARD_METADATA_UPDATED' to audit_logs action CHECK constraint
PRAGMA foreign_keys=OFF;

CREATE TABLE audit_logs_new (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
    action TEXT NOT NULL CHECK (action IN (
        'CARD_CREATED',
        'CARD_ACTIVATED',
        'DESTINATION_CHANGED',
        'CARD_DISABLED',
        'CARD_RESTORED',
        'CARD_RETIRED',
        'CARD_METADATA_UPDATED'
    )),
    actor_type TEXT NOT NULL CHECK (actor_type IN ('SYSTEM', 'PUBLIC', 'ADMIN')),
    actor_identifier TEXT NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'NOW'))
);

INSERT INTO audit_logs_new (id, card_id, action, actor_type, actor_identifier, previous_state, new_state, metadata, created_at)
SELECT id, card_id, action, actor_type, actor_identifier, previous_state, new_state, metadata, created_at FROM audit_logs;

DROP TABLE audit_logs;

ALTER TABLE audit_logs_new RENAME TO audit_logs;

CREATE INDEX IF NOT EXISTS idx_audit_logs_card_id ON audit_logs(card_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

PRAGMA foreign_keys=ON;
