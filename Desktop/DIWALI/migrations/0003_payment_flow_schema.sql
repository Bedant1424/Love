-- ====================================================================
-- NAGARJUNA TRADERS: PAYMENT FLOW, UTR TRACKING & RECONCILIATION SCHEMA
-- Migration: 0003_payment_flow_schema.sql
-- Description: DDL for payment submissions, UTR uniqueness, reconciliation, status histories
-- Mode: Restricted Test Environment (PAYMENT_COLLECTION_ENABLED=false)
-- Currency: Integer Paise (₹1.00 = 100 paise)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. PAYMENT SUBMISSIONS TABLE
-- Tracks 12-digit UTR strings submitted in restricted test environment.
-- Enforces uniqueness to prevent duplicate UTR submissions across orders.
-- Explicitly records unverified state pending manual bank statement reconciliation.
CREATE TABLE IF NOT EXISTS payment_submissions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    order_reference TEXT NOT NULL,
    utr TEXT NOT NULL UNIQUE CHECK (length(utr) = 12),
    payment_status TEXT NOT NULL DEFAULT 'RECORDED_UNVERIFIED'
        CHECK (payment_status IN ('RECORDED_UNVERIFIED', 'RECONCILED', 'REJECTED')),
    reconciled_by TEXT,
    reconciled_at TEXT,
    reconciliation_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_utr ON payment_submissions(utr);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_order ON payment_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_ref ON payment_submissions(order_reference);

-- 2. ORDER STATUS HISTORY TABLE
-- Immutable transition log for order status changes
CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    from_status TEXT,
    to_status TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON order_status_history(created_at DESC);

-- 3. PAYMENT STATUS HISTORY TABLE
-- Immutable transition log for payment verification and manual reconciliation notes
CREATE TABLE IF NOT EXISTS payment_status_history (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    payment_reference TEXT,
    from_status TEXT,
    to_status TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_status_history_order ON payment_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_status_history_created ON payment_status_history(created_at DESC);

-- 4. UPDATE SYSTEM SETTINGS FOR PAYMENT POLICY AND TIERED TOKEN RULES
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES
    ('PAYMENT_COLLECTION_ENABLED', 'false', 'Security lock: real payment collection disabled by default'),
    ('TOKEN_TIER_THRESHOLD_PAISE', '20000', 'Subtotal threshold for advance token tier transition (₹200.00)'),
    ('TOKEN_LOW_TIER_PAISE', '5000', 'Advance token for subtotal strictly below threshold (₹50.00)'),
    ('TOKEN_HIGH_TIER_PAISE', '10000', 'Advance token for subtotal equal to or above threshold (₹100.00)'),
    ('MIN_ORDER_SUBTOTAL_PAISE', '5000', 'Minimum order subtotal to cover lowest token tier (₹50.00)'),
    ('TEST_QR_VPA', 'test-fixture@nagarjunatraders', 'Non-payable test UPI QR identifier for restricted workflow testing'),
    ('TEST_QR_NOTICE', 'Payment collection is currently disabled. Test fixture provided for workflow verification only.', 'Display text on payment fixture');
