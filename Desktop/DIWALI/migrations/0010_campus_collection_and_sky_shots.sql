-- ====================================================================
-- NAGARJUNA TRADERS: CAMPUS COLLECTION & SKY SHOTS NAMING RECONCILIATION
-- Migration: 0010_campus_collection_and_sky_shots.sql
-- Description:
--   1. Updates Category 2 product names to include space ("Sky shots"):
--      - Pandav Sky shots
--      - Single Shot Sky shots
--      - Bigboss Sky shots
--      - JJ Sky shots
--      - Elephant Sky shots
--   2. Updates store location setting to "Collection at the campus".
-- ====================================================================

-- 1. Category 2: Update Product Names to 'Sky shots' with space
UPDATE products SET name = 'Pandav Sky shots', updated_at = datetime('now') WHERE id = 'prod_pandav';
UPDATE products SET name = 'Single Shot Sky shots', updated_at = datetime('now') WHERE id = 'prod_single_shot';
UPDATE products SET name = 'Bigboss Sky shots', updated_at = datetime('now') WHERE id = 'prod_skyshot_bigboss';
UPDATE products SET name = 'JJ Sky shots', updated_at = datetime('now') WHERE id = 'prod_skyshot_jj';
UPDATE products SET name = 'Elephant Sky shots', updated_at = datetime('now') WHERE id = 'prod_skyshot_elephant';

-- 2. Update store location in system settings
INSERT OR REPLACE INTO system_settings (key, value, description)
VALUES ('store_location', 'Collection at the campus', 'Standardised campus order collection location');
