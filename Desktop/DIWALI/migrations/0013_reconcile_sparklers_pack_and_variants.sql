-- ====================================================================
-- NAGARJUNA TRADERS: SPARKLERS VARIANT NAME RECONCILIATION
-- Migration: 0013_reconcile_sparklers_pack_and_variants.sql
-- Description: Reconciles Sparkler variant names from legacy '10 pkts × 10 pcs'
--              to 'Per packet' to match physical poster per-packet pricing
--              (₹30, ₹45, ₹45, ₹50, ₹70).
-- ====================================================================

PRAGMA foreign_keys = ON;

UPDATE product_variants
SET variant_name = 'Per packet',
    updated_at = datetime('now')
WHERE id IN (
    'var_sparklers_9cm_box',
    'var_sparklers_9cm_col_box',
    'var_sparklers_12cm_box',
    'var_sparklers_12cm_col_box',
    'var_sparklers_15cm_crk_box'
);
