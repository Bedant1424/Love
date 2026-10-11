-- ====================================================================
-- NAGARJUNA TRADERS: D1 INITIAL SCHEMA MIGRATION
-- Migration: 0001_initial_schema.sql
-- Description: DDL for Categories, Products, Variants, Demo Orders, Items, Audit Logs, Settings
-- Mode: Portfolio Demo Simulation
-- Currency: Integer Paise (₹1.00 = 100 paise)
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    compliance_warning TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    printed_price_text TEXT NOT NULL,
    pack_info TEXT,
    is_pack_verified INTEGER NOT NULL DEFAULT 0,
    pricing_origin TEXT NOT NULL,
    compliance_notice TEXT,
    notes TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- 3. PRODUCT VARIANTS TABLE
-- Preserves original poster printed prices separately from current demo prices
CREATE TABLE IF NOT EXISTS product_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    pack_info TEXT,
    is_pack_verified INTEGER NOT NULL DEFAULT 0,
    printed_price_text TEXT NOT NULL,
    printed_min_paise INTEGER,                -- Nullable minimum printed boundary in paise
    printed_max_paise INTEGER,                -- Nullable maximum printed boundary in paise
    printed_options_json TEXT,                -- Nullable JSON array of discrete printed options [paise, ...]
    source_notes TEXT,                        -- Verbatim poster notes & confirmation requirements
    demo_price_paise INTEGER,                 -- Nullable active demo price in paise (null if unresolved)
    price_status TEXT NOT NULL DEFAULT 'PRINTED_ESTIMATE'
        CHECK (price_status IN ('PRINTED_ESTIMATE', 'PRICE_ON_ENQUIRY', 'CONFIRMED')),
    pricing_origin TEXT NOT NULL
        CHECK (pricing_origin IN ('POSTER_EXACT', 'POSTER_RANGE', 'UNCONFIRMED_MAPPING', 'DEMO_NUMERIC', 'OWNER_CONFIRMED')),
    stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    is_available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_variants_sku ON product_variants(sku);

-- 4. DEMO ORDERS TABLE
-- Holds persistent demo simulated orders with fixed ₹100 token amount
CREATE TABLE IF NOT EXISTS demo_orders (
    id TEXT PRIMARY KEY,
    order_reference TEXT NOT NULL UNIQUE,      -- Format: DEMO-NT-XXXX
    customer_name TEXT NOT NULL,
    customer_mobile TEXT NOT NULL CHECK (length(customer_mobile) = 10),
    fulfilment_preference TEXT NOT NULL DEFAULT 'COUNTER_PICKUP'
        CHECK (fulfilment_preference IN ('COUNTER_PICKUP', 'DELIVERY_ENQUIRY')),
    operational_status TEXT NOT NULL DEFAULT 'SUBMITTED'
        CHECK (operational_status IN ('SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED')),
    payment_status TEXT NOT NULL DEFAULT 'UNPAID'
        CHECK (payment_status IN ('UNPAID', 'PENDING_VERIFICATION', 'VERIFIED_TOKEN', 'FAILED')),
    subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 10000),       -- Min ₹100.00 subtotal
    token_amount_paise INTEGER NOT NULL DEFAULT 10000,                     -- Strictly fixed ₹100.00
    remaining_balance_paise INTEGER NOT NULL CHECK (remaining_balance_paise >= 0),
    access_token TEXT NOT NULL UNIQUE,        -- Secret UUID token for order status query
    idempotency_key TEXT UNIQUE,
    customer_notes TEXT,
    payment_reference TEXT,                   -- 12-digit simulated UTR
    is_simulated_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_simulated_demo = 1),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_demo_orders_ref ON demo_orders(order_reference);
CREATE INDEX IF NOT EXISTS idx_demo_orders_op_status ON demo_orders(operational_status);
CREATE INDEX IF NOT EXISTS idx_demo_orders_pay_status ON demo_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_demo_orders_created_at ON demo_orders(created_at DESC);

-- 5. DEMO ORDER ITEMS TABLE
-- Frozen snapshot of product and variant details at time of demo order placement
CREATE TABLE IF NOT EXISTS demo_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL REFERENCES demo_orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    product_name_snapshot TEXT NOT NULL,
    variant_name_snapshot TEXT NOT NULL,
    unit_price_paise INTEGER NOT NULL CHECK (unit_price_paise > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0 AND quantity <= 50),
    line_subtotal_paise INTEGER NOT NULL CHECK (line_subtotal_paise > 0),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_demo_order_items_order ON demo_order_items(order_id);

-- 6. PRICE & OPERATIONAL AUDIT LOGS TABLE
-- Records price updates, overrides outside printed range, and admin status updates
CREATE TABLE IF NOT EXISTS price_audit_logs (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('VARIANT_PRICE', 'ORDER_STATUS', 'PAYMENT_VERIFICATION', 'SYSTEM_SETTING')),
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    operator_id TEXT NOT NULL,
    old_value_json TEXT,
    new_value_json TEXT,
    reason TEXT,
    is_override INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON price_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON price_audit_logs(created_at DESC);

-- 7. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed initial system settings
INSERT OR IGNORE INTO system_settings (key, value, description) VALUES
    ('COMMERCE_CHECKOUT_ENABLED', 'false', 'Simulated commercial checkout toggle'),
    ('FIXED_TOKEN_AMOUNT_PAISE', '10000', 'Fixed ₹100.00 token amount in minor paise'),
    ('STORE_NAME', 'NAGARJUNA TRADERS', 'Store brand title'),
    ('STORE_LOCATION', 'Sivakasi / Counter Collection', 'Physical counter pickup location'),
    ('STORE_UPI_VPA', 'nagarjunatraders@okhdfcbank', 'Demo payment VPA for display simulation');
