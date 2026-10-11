-- ====================================================================
-- NAGARJUNA TRADERS: CATALOGUE RECONCILIATION & REAL INVENTORY RESET
-- Migration: 0006_catalogue_reconciliation.sql
-- Description: Reconciles remote catalogue against authentic Diwali poster
--              specifications (6 categories, 23 products, 31 variants).
--              Resets unverified synthetic 100 default stock to 0 for
--              production inventory integrity, requiring authorized counts.
--              Preserves all historical order items snapshots and foreign keys.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Reset unverified default synthetic stock to 0 for real inventory integrity.
-- Real stock remains 0 until verified physical counts are entered by authorized staff.
UPDATE product_variants 
SET current_stock = 0 
WHERE current_stock = 100 OR current_stock IS NULL;

-- 2. Insert audit log entries into inventory_audit_logs for each variant
INSERT INTO inventory_audit_logs (
    id,
    variant_id,
    action,
    quantity_delta,
    stock_before,
    stock_after,
    operator_id,
    reason,
    created_at
)
SELECT 
    'inv_audit_rec_' || id,
    id,
    'MANUAL_ADJUST',
    -100,
    100,
    0,
    'SYSTEM_AUDIT_M9',
    'Milestone 9 Reconciliation: Reset unverified synthetic 100 default stock to 0. Real stock requires verified physical count.',
    datetime('now')
FROM product_variants;

-- 3. Defensive Cleanup: Purge any non-approved categories, products, or variants
-- This strictly guarantees that only the authentic Diwali poster records exist.
DELETE FROM product_variants 
WHERE id NOT IN (
    'var_bijli_60', 'var_bijli_70', 'var_lanka_180', 'var_lanka_210', 'var_lanka_550',
    'var_pandav_5pcs', 'var_single_shot_std', 'var_bigboss_3pcs', 'var_jj_3pcs', 'var_elephant_3pcs',
    'var_bullet_10pcs', 'var_laxmi_50pcs', 'var_kingkong_naji_10pcs', 'var_jurassic_10pcs', 'var_marshal_10pcs',
    'var_tiger_sz3', 'var_tiger_sz4', 'var_tiger_sz5', 'var_tiger_sz6', 'var_tiger_xxxl_std',
    'var_sparklers_9cm_box', 'var_sparklers_9cm_col_box', 'var_sparklers_12cm_box', 'var_sparklers_12cm_col_box', 'var_sparklers_15cm_crk_box',
    'var_kumpi_medium', 'var_kumpi_large', 'var_chakri_medium', 'var_chakri_large',
    'var_helicopter_box', 'var_ganga_jamuna_box'
);

DELETE FROM products 
WHERE id NOT IN (
    'prod_bijli_laddi', 'prod_big_lanka_laddi', 'prod_pandav', 'prod_single_shot',
    'prod_skyshot_bigboss', 'prod_skyshot_jj', 'prod_skyshot_elephant',
    'prod_bullet_bomb', 'prod_laxmi_paper_bomb', 'prod_kingkong_naji',
    'prod_jurassic_bomb', 'prod_marshal_bomb', 'prod_tiger_bomb', 'prod_tiger_xxxl_bomb',
    'prod_sparklers_9cm', 'prod_sparklers_9cm_color', 'prod_sparklers_12cm',
    'prod_sparklers_12cm_color', 'prod_sparklers_15cm_crackling',
    'prod_kumpi_pots', 'prod_chakri_spinners',
    'prod_helicopter', 'prod_ganga_jamuna'
);

DELETE FROM categories 
WHERE id NOT IN (
    'laddis', 'skyshots', 'bombs', 'sparklers', 'flowerpots-spinners', 'others'
);
