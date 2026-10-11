-- ====================================================================
-- NAGARJUNA TRADERS: D1 ORDERS SCHEMA ALIGNMENT MIGRATION
-- Migration: 0004_orders_schema_alignment.sql
-- Description: Creates canonical orders and order_items tables with
--              subtotal >= 5000 (₹50) boundary constraint, strict tiered tokens (₹50 / ₹100),
--              and RECORDED_UNVERIFIED status without claims of receipt of funds.
-- Mode: Restricted Test Environment & Production Readiness
-- Currency: Integer Paise (₹1.00 = 100 paise)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. DROP LEGACY DUPLICATE ORDER TABLES AND TEMPORARY SUBMISSIONS
DROP TABLE IF EXISTS payment_submissions;
DROP TABLE IF EXISTS demo_order_items;
DROP TABLE IF EXISTS demo_orders;

-- 2. CANONICAL ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    order_reference TEXT NOT NULL UNIQUE,      -- Format: NT-XXXX
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL CHECK (length(customer_mobile) = 10),
    fulfilment_preference TEXT NOT NULL DEFAULT 'COUNTER_PICKUP'
        CHECK (fulfilment_preference IN ('COUNTER_PICKUP', 'SPECIAL_ENQUIRY')),
    operational_status TEXT NOT NULL DEFAULT 'SUBMITTED' 
        CHECK (operational_status IN ('SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'RECORDED_UNVERIFIED', 'FAILED')),
    subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 5000),       -- Min ₹50.00 subtotal threshold
    token_amount_paise INTEGER NOT NULL CHECK (token_amount_paise IN (5000, 10000)), -- Strict ₹50 or ₹100 advance token
    remaining_balance_paise INTEGER NOT NULL CHECK (remaining_balance_paise >= 0),
    access_token TEXT NOT NULL UNIQUE,         -- Secret UUID token for header-only private lookup
    idempotency_key TEXT UNIQUE,
    customer_notes TEXT,
    payment_reference TEXT UNIQUE,             -- Exactly 12 numeric digits string UTR
    payment_submitted_at TEXT,
    is_simulated_demo INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_orders_ref ON orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_orders_op_status ON orders(operational_status);
CREATE INDEX IF NOT EXISTS idx_orders_pay_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- 3. CANONICAL ORDER ITEMS TABLE
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 50),
    line_subtotal_paise INTEGER NOT NULL CHECK (line_subtotal_paise > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- 4. CANONICAL PAYMENT SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS payment_submissions (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
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

-- 5. ALIGN SYSTEM SETTINGS FOR EXACT TOKEN POLICY
INSERT OR REPLACE INTO system_settings (key, value, description) VALUES
    ('MIN_ORDER_SUBTOTAL_PAISE', '5000', 'Enforced minimum order subtotal (₹50.00) required to cover lowest token tier'),
    ('TOKEN_TIER_THRESHOLD_PAISE', '20000', 'Advance token tier transition threshold (₹200.00)'),
    ('TOKEN_LOW_TIER_PAISE', '5000', 'Advance token for subtotal strictly below threshold (₹50.00)'),
    ('TOKEN_HIGH_TIER_PAISE', '10000', 'Advance token for subtotal equal to or above threshold (₹100.00)'),
    ('PAYMENT_COLLECTION_ENABLED', 'false', 'Security lock: real payment collection disabled');
