-- ====================================================================
-- NAGARJUNA TRADERS: SKYSHOTS LABELS & CUSTOMER COPY CLEANUP
-- Migration: 0009_skyshots_and_copy_cleanup.sql
-- Description: Updates Skyshots products to complete category names:
--              Pandav Skyshots, Single Shot Skyshots, Bigboss Skyshots,
--              JJ Skyshots, Elephant Skyshots.
--              Removes pack estimate strings and awkward internal notes.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Complete Skyshots Product Names
UPDATE products SET name = 'Pandav Skyshots', pack_info = '5 pcs pack', updated_at = datetime('now') WHERE id = 'prod_pandav';
UPDATE products SET name = 'Single Shot Skyshots', pack_info = '', updated_at = datetime('now') WHERE id = 'prod_single_shot';
UPDATE products SET name = 'Bigboss Skyshots', pack_info = '3 pcs pack', updated_at = datetime('now') WHERE id = 'prod_skyshot_bigboss';
UPDATE products SET name = 'JJ Skyshots', pack_info = '3 pcs pack', updated_at = datetime('now') WHERE id = 'prod_skyshot_jj';
UPDATE products SET name = 'Elephant Skyshots', pack_info = '3 pcs pack', updated_at = datetime('now') WHERE id = 'prod_skyshot_elephant';

-- 2. Clean Pack Info on Laddis and Single Shot
UPDATE products SET pack_info = '', updated_at = datetime('now') WHERE id IN ('prod_bijli_laddi', 'prod_big_lanka_laddi');
UPDATE product_variants SET pack_info = '', updated_at = datetime('now') WHERE product_id IN ('prod_bijli_laddi', 'prod_big_lanka_laddi');
UPDATE product_variants SET pack_info = '' WHERE id = 'var_single_shot_std';
