-- ====================================================================
-- NAGARJUNA TRADERS: POSTER PRICE RECONCILIATION & ORDERABLE BOUNDS
-- Migration: 0008_poster_price_reconciliation.sql
-- Description: Applies the latest official Diwali poster pricing across all
--              6 categories (21 products, 28 variants).
--              Sets initial active price to lower bound of each printed range.
--              Maintains 0 initial physical stock for inventory integrity.
--              Removes obsolete unconfirmed items absent from latest poster.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. DEFENSIVE CLEANUP: Remove obsolete items absent from latest poster
-- Bullet Bomb and Laxmi Paper Bomb are absent from latest poster.
DELETE FROM product_variants WHERE id IN ('var_bullet_10pcs', 'var_laxmi_50pcs', 'var_bijli_70', 'var_lanka_180', 'var_lanka_210');
DELETE FROM products WHERE id IN ('prod_bullet_bomb', 'prod_laxmi_paper_bomb');

-- 2. CATEGORY 1: LADDIS
UPDATE products 
SET printed_price_text = '₹50 / ₹60',
    notes = 'Discrete printed options: ₹50 and ₹60',
    updated_at = datetime('now')
WHERE id = 'prod_bijli_laddi';

-- Insert var_bijli_50 if not exists
INSERT OR IGNORE INTO product_variants (
    id, product_id, variant_name, sku, pack_info, is_pack_verified,
    printed_price_text, printed_min_paise, printed_max_paise, printed_options_json,
    source_notes, demo_price_paise, price_status, pricing_origin,
    stock_quantity, current_stock, reserved_stock, low_stock_threshold, is_available
) VALUES (
    'var_bijli_50', 'prod_bijli_laddi', 'Printed Option: ₹50', 'LAD-BIJ-50', 'Size unconfirmed on poster', 0,
    '₹50', 5000, 6000, '[5000, 6000]',
    'Printed ₹50 option on poster; exact size mapping unconfirmed', 5000, 'PRINTED_ESTIMATE', 'POSTER_RANGE',
    0, 0, 0, 10, 1
);

UPDATE product_variants 
SET variant_name = 'Printed Option: ₹60',
    printed_price_text = '₹60',
    printed_min_paise = 5000,
    printed_max_paise = 6000,
    printed_options_json = '[5000, 6000]',
    demo_price_paise = 6000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_bijli_60';

-- Big Lanka Laddi
UPDATE products 
SET printed_price_text = '₹200 / ₹200 / ₹550',
    notes = 'Discrete printed options: ₹200 (repeated option) and ₹550',
    updated_at = datetime('now')
WHERE id = 'prod_big_lanka_laddi';

INSERT OR IGNORE INTO product_variants (
    id, product_id, variant_name, sku, pack_info, is_pack_verified,
    printed_price_text, printed_min_paise, printed_max_paise, printed_options_json,
    source_notes, demo_price_paise, price_status, pricing_origin,
    stock_quantity, current_stock, reserved_stock, low_stock_threshold, is_available
) VALUES 
(
    'var_lanka_200_1', 'prod_big_lanka_laddi', 'Printed Option: ₹200 (1)', 'LAD-LNK-200-1', 'Size unconfirmed on poster', 0,
    '₹200', 20000, 55000, '[20000, 20000, 55000]',
    'Printed ₹200 option on poster (first option); exact size mapping unconfirmed', 20000, 'PRINTED_ESTIMATE', 'POSTER_RANGE',
    0, 0, 0, 10, 1
),
(
    'var_lanka_200_2', 'prod_big_lanka_laddi', 'Printed Option: ₹200 (2)', 'LAD-LNK-200-2', 'Size unconfirmed on poster', 0,
    '₹200', 20000, 55000, '[20000, 20000, 55000]',
    'Repeated printed ₹200 option preserved as printed until owner confirmation', 20000, 'PRINTED_ESTIMATE', 'POSTER_RANGE',
    0, 0, 0, 10, 1
);

UPDATE product_variants 
SET variant_name = 'Printed Option: ₹550',
    printed_price_text = '₹550',
    printed_min_paise = 20000,
    printed_max_paise = 55000,
    printed_options_json = '[20000, 20000, 55000]',
    demo_price_paise = 55000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_lanka_550';

-- 3. CATEGORY 2: SKYSHOTS
UPDATE products SET printed_price_text = '₹180 to ₹200', updated_at = datetime('now') WHERE id = 'prod_pandav';
UPDATE product_variants 
SET printed_price_text = '₹180 to ₹200',
    printed_min_paise = 18000,
    printed_max_paise = 20000,
    demo_price_paise = 18000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_pandav_5pcs';

UPDATE products SET printed_price_text = '₹150', updated_at = datetime('now') WHERE id = 'prod_single_shot';
UPDATE product_variants 
SET printed_price_text = '₹150',
    printed_min_paise = 15000,
    printed_max_paise = 15000,
    demo_price_paise = 15000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_single_shot_std';

UPDATE products SET name = 'Bigboss', printed_price_text = '₹400 to ₹450', updated_at = datetime('now') WHERE id = 'prod_skyshot_bigboss';
UPDATE product_variants 
SET printed_price_text = '₹400 to ₹450',
    printed_min_paise = 40000,
    printed_max_paise = 45000,
    demo_price_paise = 40000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_bigboss_3pcs';

UPDATE products SET name = 'JJ', printed_price_text = '₹450 to ₹500', updated_at = datetime('now') WHERE id = 'prod_skyshot_jj';
UPDATE product_variants 
SET printed_price_text = '₹450 to ₹500',
    printed_min_paise = 45000,
    printed_max_paise = 50000,
    demo_price_paise = 45000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_jj_3pcs';

UPDATE products SET name = 'Elephant', printed_price_text = '₹550 to ₹600', updated_at = datetime('now') WHERE id = 'prod_skyshot_elephant';
UPDATE product_variants 
SET printed_price_text = '₹550 to ₹600',
    printed_min_paise = 55000,
    printed_max_paise = 60000,
    demo_price_paise = 55000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_elephant_3pcs';

-- 4. CATEGORY 3: BOMBS
UPDATE products SET printed_price_text = '₹380', updated_at = datetime('now') WHERE id = 'prod_kingkong_naji';
UPDATE product_variants 
SET printed_price_text = '₹380',
    printed_min_paise = 38000,
    printed_max_paise = 38000,
    demo_price_paise = 38000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_kingkong_naji_10pcs';

UPDATE products SET printed_price_text = '₹200', updated_at = datetime('now') WHERE id = 'prod_jurassic_bomb';
UPDATE product_variants 
SET printed_price_text = '₹200',
    printed_min_paise = 20000,
    printed_max_paise = 20000,
    demo_price_paise = 20000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_jurassic_10pcs';

UPDATE products SET printed_price_text = '₹250', updated_at = datetime('now') WHERE id = 'prod_marshal_bomb';
UPDATE product_variants 
SET printed_price_text = '₹250',
    printed_min_paise = 25000,
    printed_max_paise = 25000,
    demo_price_paise = 25000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_marshal_10pcs';

UPDATE products SET printed_price_text = '₹350 to ₹400 per box', updated_at = datetime('now') WHERE id = 'prod_tiger_bomb';
UPDATE product_variants 
SET printed_price_text = '₹350 to ₹400 per box',
    printed_min_paise = 35000,
    printed_max_paise = 40000,
    demo_price_paise = 25000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹250',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz3';

UPDATE product_variants 
SET printed_price_text = '₹350 to ₹400 per box',
    printed_min_paise = 35000,
    printed_max_paise = 40000,
    demo_price_paise = 27500,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹275',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz4';

UPDATE product_variants 
SET printed_price_text = '₹350 to ₹400 per box',
    printed_min_paise = 35000,
    printed_max_paise = 40000,
    demo_price_paise = 30000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹300',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz5';

UPDATE product_variants 
SET printed_price_text = '₹350 to ₹400 per box',
    printed_min_paise = 35000,
    printed_max_paise = 40000,
    demo_price_paise = 35000,
    price_status = 'CONFIRMED',
    pricing_origin = 'OWNER_CONFIRMED',
    source_notes = 'Owner confirmed active price ₹350',
    updated_at = datetime('now')
WHERE id = 'var_tiger_sz6';

UPDATE products SET printed_price_text = '₹550 per box', updated_at = datetime('now') WHERE id = 'prod_tiger_xxxl_bomb';
UPDATE product_variants 
SET printed_price_text = '₹550 per box',
    printed_min_paise = 55000,
    printed_max_paise = 55000,
    demo_price_paise = 55000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_tiger_xxxl_std';

-- 5. CATEGORY 4: JHARJHARI & SPARKLERS
UPDATE products SET pack_info = 'Per packet', printed_price_text = '₹30 per packet', updated_at = datetime('now') WHERE id = 'prod_sparklers_9cm';
UPDATE product_variants 
SET pack_info = 'Per packet',
    printed_price_text = '₹30 per packet',
    printed_min_paise = 3000,
    printed_max_paise = 3000,
    demo_price_paise = 3000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_9cm_box';

UPDATE products SET pack_info = 'Per packet', printed_price_text = '₹45 per packet', updated_at = datetime('now') WHERE id = 'prod_sparklers_9cm_color';
UPDATE product_variants 
SET pack_info = 'Per packet',
    printed_price_text = '₹45 per packet',
    printed_min_paise = 4500,
    printed_max_paise = 4500,
    demo_price_paise = 4500,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_9cm_col_box';

UPDATE products SET pack_info = 'Per packet', printed_price_text = '₹45 per packet', updated_at = datetime('now') WHERE id = 'prod_sparklers_12cm';
UPDATE product_variants 
SET pack_info = 'Per packet',
    printed_price_text = '₹45 per packet',
    printed_min_paise = 4500,
    printed_max_paise = 4500,
    demo_price_paise = 4500,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_12cm_box';

UPDATE products SET pack_info = 'Per packet', printed_price_text = '₹50 per packet', updated_at = datetime('now') WHERE id = 'prod_sparklers_12cm_color';
UPDATE product_variants 
SET pack_info = 'Per packet',
    printed_price_text = '₹50 per packet',
    printed_min_paise = 5000,
    printed_max_paise = 5000,
    demo_price_paise = 5000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_12cm_col_box';

UPDATE products SET pack_info = 'Per packet', printed_price_text = '₹70 per packet', updated_at = datetime('now') WHERE id = 'prod_sparklers_15cm_crackling';
UPDATE product_variants 
SET pack_info = 'Per packet',
    printed_price_text = '₹70 per packet',
    printed_min_paise = 7000,
    printed_max_paise = 7000,
    demo_price_paise = 7000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_sparklers_15cm_crk_box';

-- 6. CATEGORY 5: KUMPI & CHAKRI
UPDATE products SET printed_price_text = 'Medium: ₹190 to ₹200 / Large: ₹250 to ₹300 per box', updated_at = datetime('now') WHERE id = 'prod_kumpi_pots';
UPDATE product_variants 
SET printed_price_text = '₹190 to ₹200 per box',
    printed_min_paise = 19000,
    printed_max_paise = 20000,
    demo_price_paise = 19000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_kumpi_medium';

UPDATE product_variants 
SET printed_price_text = '₹250 to ₹300 per box',
    printed_min_paise = 25000,
    printed_max_paise = 30000,
    demo_price_paise = 25000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_kumpi_large';

UPDATE products SET printed_price_text = 'Medium: ₹120 / Large: ₹200 to ₹300 per box', updated_at = datetime('now') WHERE id = 'prod_chakri_spinners';
UPDATE product_variants 
SET printed_price_text = '₹120 per box',
    printed_min_paise = 12000,
    printed_max_paise = 12000,
    demo_price_paise = 12000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_EXACT',
    updated_at = datetime('now')
WHERE id = 'var_chakri_medium';

UPDATE product_variants 
SET printed_price_text = '₹200 to ₹300 per box',
    printed_min_paise = 20000,
    printed_max_paise = 30000,
    demo_price_paise = 20000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_chakri_large';

-- 7. CATEGORY 6: OTHERS
UPDATE products SET printed_price_text = '₹100 to ₹290 per box', updated_at = datetime('now') WHERE id = 'prod_helicopter';
UPDATE product_variants 
SET printed_price_text = '₹100 to ₹290 per box',
    printed_min_paise = 10000,
    printed_max_paise = 29000,
    demo_price_paise = 10000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_helicopter_box';

UPDATE products SET printed_price_text = '₹140 to ₹150 per box', updated_at = datetime('now') WHERE id = 'prod_ganga_jamuna';
UPDATE product_variants 
SET printed_price_text = '₹140 to ₹150 per box',
    printed_min_paise = 14000,
    printed_max_paise = 15000,
    demo_price_paise = 14000,
    price_status = 'PRINTED_ESTIMATE',
    pricing_origin = 'POSTER_RANGE',
    updated_at = datetime('now')
WHERE id = 'var_ganga_jamuna_box';

-- Enforce 0 stock across all variants if uncounted
UPDATE product_variants 
SET current_stock = 0 
WHERE current_stock IS NULL;
