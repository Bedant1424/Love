-- ====================================================================
-- NAGARJUNA TRADERS: PERSISTENT R2 STORAGE METADATA MIGRATION
-- Migration: 0007_qr_r2_storage_metadata.sql
-- Description: Adds R2 object storage metadata columns to qr_versions.
--              Eliminates inline base64 data URLs in D1 rows.
--              Preserves full QR version history and audit logs.
-- ====================================================================

PRAGMA foreign_keys = ON;

-- 1. Add R2 object storage metadata columns to qr_versions
ALTER TABLE qr_versions ADD COLUMN r2_object_key TEXT;
ALTER TABLE qr_versions ADD COLUMN content_type TEXT DEFAULT 'image/png';
ALTER TABLE qr_versions ADD COLUMN file_size_bytes INTEGER DEFAULT 0;
ALTER TABLE qr_versions ADD COLUMN sha256_checksum TEXT DEFAULT '';
ALTER TABLE qr_versions ADD COLUMN merchant_category_code TEXT;
ALTER TABLE qr_versions ADD COLUMN merchant_id TEXT;

-- 2. Backfill existing test fixture qr_v1_seed with R2 storage metadata
-- Converts direct/base64 URL to server-controlled controlled route while preserving test fixture identity
UPDATE qr_versions
SET 
    r2_object_key = 'qr-assets/qr_v1_seed.png',
    content_type = 'image/png',
    file_size_bytes = 1024,
    sha256_checksum = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    image_url = '/api/v1/qr-images/qr_v1_seed'
WHERE id = 'qr_v1_seed';

-- 3. Create index on r2_object_key for fast lookup
CREATE INDEX IF NOT EXISTS idx_qr_versions_r2_key ON qr_versions(r2_object_key);
