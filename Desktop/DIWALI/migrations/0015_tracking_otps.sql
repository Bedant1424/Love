-- Migration 0015: Customer order tracking OTP table
-- Enables secure lost reference lookup for customers via mobile verification.

CREATE TABLE IF NOT EXISTS tracking_otps (
    id TEXT PRIMARY KEY,
    mobile_number TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tracking_otps_mobile ON tracking_otps(mobile_number);
CREATE INDEX IF NOT EXISTS idx_tracking_otps_expires ON tracking_otps(expires_at);
