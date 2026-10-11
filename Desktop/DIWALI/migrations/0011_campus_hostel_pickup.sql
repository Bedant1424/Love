-- Forward Migration 0011: Campus & Hostel Pickup Location Standardization
-- Updates STORE_LOCATION in system_settings table to reflect Campus Pickup / Hostel Pickup.

UPDATE system_settings 
SET value = 'Campus Pickup / Hostel Pickup',
    updated_at = CURRENT_TIMESTAMP
WHERE key IN ('STORE_LOCATION', 'store_location');
