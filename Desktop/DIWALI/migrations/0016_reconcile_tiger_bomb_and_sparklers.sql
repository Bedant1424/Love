-- ====================================================================
-- NAGARJUNA TRADERS: RECONCILE TIGER BOMB AND SPARKLERS
-- Migration: 0016_reconcile_tiger_bomb_and_sparklers.sql
-- Description:
--   1. Reconciles Tiger Bomb sizes 3, 4, 5, 6 to owner-entered active prices:
--      Size 3: ₹250 (25000 paise)
--      Size 4: ₹275 (27500 paise)
--      Size 5: ₹300 (30000 paise)
--      Size 6: ₹350 (35000 paise)
--      Cleans stale notes on prod_tiger_bomb.
--   2. Reconciles Sparkler variant names to authentic product titles:
--      9 cm Sparklers, 9 cm Color Sparklers, 12 cm Sparklers,
--      12 cm Color Sparklers, 15 cm Crackling Sparklers, with pack_info = 'Per packet'.
--      Purges the legacy '10 pkts × 10 pcs' footnote.
--   3. Reconciles Big Lanka Laddi discrete options (Option 1, Option 2, Option 3)
--      and purges internal 'Printed Option' prefixes.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Tiger Bomb Active Price & Notes Reconciliation
UPDATE product_variants
SET demo_price_paise = 25000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹250',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz3';

UPDATE product_variants
SET demo_price_paise = 27500,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹275',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz4';

UPDATE product_variants
SET demo_price_paise = 30000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹300',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz5';

UPDATE product_variants
SET demo_price_paise = 35000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹350',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz6';

UPDATE products
SET notes = NULL
WHERE id = 'prod_tiger_bomb';

-- 2. Big Lanka Laddi Option Names & Notes
UPDATE product_variants
SET variant_name = 'Option 1',
    demo_price_paise = 20000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Printed ₹200 option on poster',
    updated_at = datetime('now')
WHERE id = 'var_lanka_200_1';

UPDATE product_variants
SET variant_name = 'Option 2',
    demo_price_paise = 20000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Repeated printed ₹200 option preserved as printed',
    updated_at = datetime('now')
WHERE id = 'var_lanka_200_2';

UPDATE product_variants
SET variant_name = 'Option 3',
    demo_price_paise = 55000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Printed ₹550 option on poster',
    updated_at = datetime('now')
WHERE id = 'var_lanka_550';

UPDATE products
SET notes = 'Discrete printed options: ₹200 and ₹550'
WHERE id = 'prod_big_lanka_laddi';

-- 3. Sparklers Variant Names & Notes
UPDATE products
SET pack_info = 'Per packet',
    notes = NULL
WHERE id IN (
  'prod_sparklers_9cm',
  'prod_sparklers_9cm_color',
  'prod_sparklers_12cm',
  'prod_sparklers_12cm_color',
  'prod_sparklers_15cm_crackling'
);

UPDATE product_variants
SET variant_name = '9 cm Sparklers',
    pack_info = 'Per packet',
    source_notes = 'Official poster per-packet pricing',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_9cm_box';

UPDATE product_variants
SET variant_name = '9 cm Color Sparklers',
    pack_info = 'Per packet',
    source_notes = 'Official poster per-packet pricing',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_9cm_col_box';

UPDATE product_variants
SET variant_name = '12 cm Sparklers',
    pack_info = 'Per packet',
    source_notes = 'Official poster per-packet pricing',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_12cm_box';

UPDATE product_variants
SET variant_name = '12 cm Color Sparklers',
    pack_info = 'Per packet',
    source_notes = 'Official poster per-packet pricing',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_12cm_col_box';

UPDATE product_variants
SET variant_name = '15 cm Crackling Sparklers',
    pack_info = 'Per packet',
    source_notes = 'Official poster per-packet pricing',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_15cm_crk_box';
