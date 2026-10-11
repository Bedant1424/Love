-- ====================================================================
-- NAGARJUNA TRADERS: D1 INVENTORY, QR ROTATION, SUPPORT & CUSTOMERS
-- Migration: 0005_inventory_and_qr_management.sql
-- Description: Adds stock tracking columns to product_variants, creates
--              inventory_audit_logs, qr_versions, payment_issues, and
--              customers tables with indexes and audit trails.
-- Currency: Integer Paise (₹1.00 = 100 paise)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. ADD INVENTORY COLUMNS TO PRODUCT_VARIANTS
-- SQLite allows ADD COLUMN with DEFAULT values
ALTER TABLE product_variants ADD COLUMN current_stock INTEGER NOT NULL DEFAULT 100;
ALTER TABLE product_variants ADD COLUMN reserved_stock INTEGER NOT NULL DEFAULT 0;
ALTER TABLE product_variants ADD COLUMN low_stock_threshold INTEGER NOT NULL DEFAULT 10;

-- 2. INVENTORY AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS inventory_audit_logs (
    id TEXT PRIMARY KEY,
    variant_id TEXT NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('MANUAL_ADJUST', 'RESERVATION', 'RELEASE', 'COMMIT', 'CANCEL')),
    quantity_delta INTEGER NOT NULL,
    stock_before INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    operator_id TEXT NOT NULL,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_inv_audit_variant ON inventory_audit_logs(variant_id);
CREATE INDEX IF NOT EXISTS idx_inv_audit_created ON inventory_audit_logs(created_at DESC);

-- 3. QR VERSIONS AND ROTATION MANAGEMENT
CREATE TABLE IF NOT EXISTS qr_versions (
    id TEXT PRIMARY KEY,
    version_number INTEGER NOT NULL UNIQUE,
    label TEXT NOT NULL,
    vpa TEXT NOT NULL,
    account_name TEXT NOT NULL,
    image_url TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0, 1)),
    upload_operator_id TEXT NOT NULL,
    activation_notes TEXT,
    activated_at TEXT,
    deactivated_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_qr_versions_active ON qr_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_qr_versions_num ON qr_versions(version_number DESC);

-- 4. PAYMENT SUPPORT ISSUES TABLE
CREATE TABLE IF NOT EXISTS payment_issues (
    id TEXT PRIMARY KEY,
    issue_reference TEXT NOT NULL UNIQUE,      -- Format: ISS-XXXX
    order_reference TEXT,                      -- References orders(order_reference)
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL CHECK (length(customer_mobile) = 10),
    issue_type TEXT NOT NULL CHECK (issue_type IN (
        'QR_LIMIT_REACHED',
        'QR_NOT_SCANNING',
        'APP_CANNOT_OPEN',
        'PAYMENT_APP_ERROR',
        'UTR_SUBMISSION_FAILED',
        'OTHER'
    )),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')),
    staff_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payment_issues_status ON payment_issues(status);
CREATE INDEX IF NOT EXISTS idx_payment_issues_order ON payment_issues(order_reference);
CREATE INDEX IF NOT EXISTS idx_payment_issues_created ON payment_issues(created_at DESC);

-- 5. NORMALIZED CUSTOMER DIRECTORY TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mobile_number TEXT NOT NULL UNIQUE CHECK (length(mobile_number) = 10),
    total_orders INTEGER NOT NULL DEFAULT 0,
    lifetime_spent_paise INTEGER NOT NULL DEFAULT 0,
    last_order_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile_number);
CREATE INDEX IF NOT EXISTS idx_customers_spent ON customers(lifetime_spent_paise DESC);

-- 6. SEED DEFAULT ACTIVE QR VERSION (TEST FIXTURE V1)
INSERT OR IGNORE INTO qr_versions (
    id,
    version_number,
    label,
    vpa,
    account_name,
    image_url,
    is_active,
    upload_operator_id,
    activation_notes,
    activated_at,
    created_at
) VALUES (
    'qr_v1_seed',
    1,
    'Default Testing Fixture QR (v1)',
    'test-fixture@nagarjunatraders',
    'NAGARJUNA TRADERS (TEST)',
    '/images/test-qr-v1.png',
    1,
    'SYSTEM',
    'Initial active restricted test fixture QR',
    datetime('now'),
    datetime('now')
);
