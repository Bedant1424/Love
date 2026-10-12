-- ====================================================================
-- NAGARJUNA TRADERS: CLEAN VARIANT NAMES & ORDER SNAPSHOT RECONCILIATION
-- Migration: 0014_clean_variant_names_and_order_snapshots.sql
-- Description: Removes internal 'Printed Option' prefixes from Big Lanka Laddi
--              and Bijli Laddi variant names, adopting clean choice labels.
--              Repairs existing order_items snapshots so product_name_snapshot
--              stores the true product name and variant_name_snapshot stores the variant.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Reconcile Bijli Laddi variant names
UPDATE product_variants
SET variant_name = 'Option 1',
    updated_at = datetime('now')
WHERE id = 'var_bijli_50';

UPDATE product_variants
SET variant_name = 'Option 2',
    updated_at = datetime('now')
WHERE id = 'var_bijli_60';

-- 2. Reconcile Big Lanka Laddi variant names
UPDATE product_variants
SET variant_name = 'Option 1',
    updated_at = datetime('now')
WHERE id = 'var_lanka_200_1';

UPDATE product_variants
SET variant_name = 'Option 2',
    updated_at = datetime('now')
WHERE id = 'var_lanka_200_2';

UPDATE product_variants
SET variant_name = 'Option 3',
    updated_at = datetime('now')
WHERE id = 'var_lanka_550';

-- 3. Repair existing order_items snapshots
-- Map product_id to product name and variant_id to variant_name
UPDATE order_items
SET product_name_snapshot = (
      SELECT p.name FROM products p WHERE p.id = order_items.product_id
    ),
    variant_name_snapshot = (
      SELECT pv.variant_name FROM product_variants pv WHERE pv.id = order_items.variant_id
    )
WHERE product_id IN (SELECT id FROM products)
  AND (
    product_name_snapshot LIKE 'Printed Option%'
    OR product_name_snapshot LIKE '%box'
    OR product_name_snapshot LIKE '%pack'
    OR product_name_snapshot LIKE 'Size %'
    OR product_name_snapshot = 'Per Box'
    OR product_name_snapshot = 'Per packet'
    OR product_name_snapshot = 'Standard Unit'
    OR product_name_snapshot = 'Kumpi Medium'
    OR product_name_snapshot = 'Kumpi Large'
    OR product_name_snapshot = 'Chakri Medium'
    OR product_name_snapshot = 'Chakri Large'
    OR product_name_snapshot = 'Helicopter Box'
    OR product_name_snapshot = 'Ganga Jamuna Box'
    OR variant_name_snapshot IS NULL
    OR variant_name_snapshot = ''
  );
