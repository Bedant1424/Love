INSERT OR IGNORE INTO batches (id, name, card_count, notes)
VALUES ('batch_local_001', 'Local Verification Fleet', 4, 'Test dataset for Milestone 2 local verification');

INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url, activated_at)
VALUES (
    'card_local_actv',
    'ACTV123456',
    'batch_local_001',
    'ACTIVE',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Local Test Clinic',
    'https://search.google.com/local/writereview?placeid=ChIJ_TEST_ACTIVE_001',
    '2026-10-01T00:00:00.000Z'
);

INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash)
VALUES (
    'card_local_unac',
    'PEND123456',
    'batch_local_001',
    'UNACTIVATED',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
);

INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
VALUES (
    'card_local_disa',
    'DACT123456',
    'batch_local_001',
    'DISABLED',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Local Test Cafe',
    'https://search.google.com/local/writereview?placeid=ChIJ_TEST_DISABLED_002'
);

INSERT OR REPLACE INTO cards (id, public_id, batch_id, status, activation_code_hash, business_name, destination_url)
VALUES (
    'card_local_retr',
    'RETR123456',
    'batch_local_001',
    'RETIRED',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'Local Test Auto',
    'https://search.google.com/local/writereview?placeid=ChIJ_TEST_RETIRED_003'
);
