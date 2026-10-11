-- ====================================================================
-- NAGARJUNA TRADERS: D1 CATALOGUE SEEDING MIGRATION
-- Migration: 0002_seed_catalogue.sql
-- Description: Authentic seed data for Categories, Products, and Variants from Diwali Poster
-- Mode: Portfolio Demo Simulation
-- ====================================================================

-- 1. SEED CATEGORIES
INSERT OR IGNORE INTO categories (id, name, slug, description, compliance_warning, sort_order, is_active) VALUES
    ('laddis', 'Laddis', 'laddis', 'Garland / series crackers from the Diwali catalogue poster.', 'Notice: Series/garland crackers are shown for catalogue demonstration purposes only.', 1, 1),
    ('skyshots', 'Skyshots', 'skyshots', 'Aerial single tubes and multi-break shell fireworks.', NULL, 2, 1),
    ('bombs', 'Bombs', 'bombs', 'Traditional sound crackers and paper-wrapped crackers.', NULL, 3, 1),
    ('sparklers', 'Jharjhari & Sparklers', 'sparklers', 'Handheld festive sparklers and color crackling sparklers.', NULL, 4, 1),
    ('flowerpots-spinners', 'Kumpi & Chakri', 'kumpi-chakri', 'Ground sparkling fountain flower pots (Kumpi) and spinning wheel crackers (Chakri).', NULL, 5, 1),
    ('others', 'Others', 'others', 'Novelty aerial spinners and combination fireworks.', NULL, 6, 1);

-- 2. SEED PRODUCTS
-- Category 1: Laddis
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_bijli_laddi', 'laddis', 'Bijli Laddi', 'bijli-laddi', '₹60 / ₹70 (depending on size)', 'Exact size mapping unconfirmed on poster', 0, 'POSTER_RANGE', 'Shown for portfolio catalogue demonstration.', 'Correspondence between size and price unconfirmed on poster'),
    ('prod_big_lanka_laddi', 'laddis', 'Big Lanka Laddi', 'big-lanka-laddi', '₹180 / ₹210 / ₹550 (depending on size)', 'Exact size mapping unconfirmed on poster', 0, 'POSTER_RANGE', 'Shown for portfolio catalogue demonstration.', 'Correspondence between size and price unconfirmed on poster');

-- Category 2: Skyshots
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_pandav', 'skyshots', 'Pandav', 'pandav', '₹200 to ₹250', '5 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹200 to ₹250 price range on poster (unresolved demo price)'),
    ('prod_single_shot', 'skyshots', 'Single Shot', 'single-shot', '₹120', 'Standard Unit', 0, 'POSTER_EXACT', NULL, 'Printed exact price ₹120 on poster'),
    ('prod_skyshot_bigboss', 'skyshots', 'Skyshot - Bigboss', 'skyshot-bigboss', '₹350', '3 pcs', 1, 'POSTER_EXACT', NULL, 'Printed exact price ₹350 on poster; pack is 3 pcs'),
    ('prod_skyshot_jj', 'skyshots', 'Skyshot - JJ', 'skyshot-jj', '₹400 to ₹450', '3 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹400 to ₹450 range on poster (unresolved demo price)'),
    ('prod_skyshot_elephant', 'skyshots', 'Skyshot - Elephant', 'skyshot-elephant', '₹550 to ₹600', '3 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹550 to ₹600 range on poster (unresolved demo price)');

-- Category 3: Bombs
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_bullet_bomb', 'bombs', 'Bullet Bomb', 'bullet-bomb', '₹80 to ₹100', '10 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹80 to ₹100 range on poster (unresolved demo price)'),
    ('prod_laxmi_paper_bomb', 'bombs', 'Laxmi Paper Bomb', 'laxmi-paper-bomb', '₹240', '50 pcs', 1, 'POSTER_EXACT', NULL, 'Printed exact price ₹240 on poster for 50 pcs box'),
    ('prod_kingkong_naji', 'bombs', 'Kingkong / Naji', 'kingkong-naji', '₹250', '10 pcs', 1, 'POSTER_EXACT', NULL, 'Printed exact price ₹250 on poster for 10 pcs box'),
    ('prod_jurassic_bomb', 'bombs', 'Jurassic Bomb', 'jurassic-bomb', '₹200 to ₹220', '10 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹200 to ₹220 range on poster (unresolved demo price)'),
    ('prod_marshal_bomb', 'bombs', 'Marshal Bomb', 'marshal-bomb', '₹200 to ₹220', '10 pcs', 1, 'POSTER_RANGE', NULL, 'Printed as ₹200 to ₹220 range on poster (unresolved demo price)'),
    ('prod_tiger_bomb', 'bombs', 'Tiger Bomb', 'tiger-bomb', '₹200 to ₹400 per box (Sizes 3, 4, 5, 6)', 'Sizes 3, 4, 5, 6', 0, 'UNCONFIRMED_MAPPING', NULL, 'Sizes 3, 4, 5, 6 printed as ₹200 to ₹400 range on poster without individual mapping'),
    ('prod_tiger_xxxl_bomb', 'bombs', 'Tiger XXXL Bomb', 'tiger-xxxl-bomb', '₹500 per box', 'Per box', 0, 'POSTER_EXACT', NULL, 'Printed exact price ₹500 on poster per box');

-- Category 4: Jharjhari & Sparklers
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_sparklers_9cm', 'sparklers', '9 cm Sparklers', 'sparklers-9cm', '₹180', '10 pkts × 10 pcs', 0, 'POSTER_EXACT', NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.'),
    ('prod_sparklers_9cm_color', 'sparklers', '9 cm Color Sparklers', 'sparklers-9cm-color', '₹250', '10 pkts × 10 pcs', 0, 'POSTER_EXACT', NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.'),
    ('prod_sparklers_12cm', 'sparklers', '12 cm Sparklers', 'sparklers-12cm', '₹250', '10 pkts × 10 pcs', 0, 'POSTER_EXACT', NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.'),
    ('prod_sparklers_12cm_color', 'sparklers', '12 cm Color Sparklers', 'sparklers-12cm-color', '₹300', '10 pkts × 10 pcs', 0, 'POSTER_EXACT', NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.'),
    ('prod_sparklers_15cm_crackling', 'sparklers', '15 cm Crackling Sparklers', 'sparklers-15cm-crackling', '₹350', '10 pkts × 10 pcs', 0, 'POSTER_EXACT', NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.');

-- Category 5: Kumpi & Chakri
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_kumpi_pots', 'flowerpots-spinners', 'Kumpi (Flower Pots)', 'kumpi-pots', 'Medium: ₹150 to ₹200 / Large: ₹200 to ₹250', 'Per box', 0, 'POSTER_RANGE', NULL, 'Poster lists Medium (₹150 to ₹200) and Large (₹200 to ₹250). No Small, Big, Special, or Deluxe exist on poster.'),
    ('prod_chakri_spinners', 'flowerpots-spinners', 'Chakri (Ground Spinners)', 'chakri-spinners', 'Medium: ₹100 / Large: ₹250 to ₹350', 'Per box', 0, 'POSTER_RANGE', NULL, 'Poster lists Medium (₹100) and Large (₹250 to ₹350)');

-- Category 6: Others
INSERT OR IGNORE INTO products (id, category_id, name, slug, printed_price_text, pack_info, is_pack_verified, pricing_origin, compliance_notice, notes) VALUES
    ('prod_helicopter', 'others', 'Helicopter', 'helicopter', '₹150 to ₹200 per box', 'Per box', 0, 'POSTER_RANGE', NULL, 'Printed as ₹150 to ₹200 per box on poster (unresolved demo price)'),
    ('prod_ganga_jamuna', 'others', 'Ganga Jamuna', 'ganga-jamuna', '₹150 per box', 'Per box', 0, 'POSTER_EXACT', NULL, 'Printed exact price ₹150 per box on poster');

-- 3. SEED PRODUCT VARIANTS (Total: 26 Variants)
-- Category 1 Variants: Laddis
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_bijli_60', 'prod_bijli_laddi', 'Printed Option: ₹60', 'LAD-BIJ-60', 'Size unconfirmed on poster', 0, '₹60', 6000, 7000, '[6000, 7000]', 'Printed ₹60 option on poster; exact size mapping unconfirmed', 6000, 'PRINTED_ESTIMATE', 'DEMO_NUMERIC', 100, 1),
    ('var_bijli_70', 'prod_bijli_laddi', 'Printed Option: ₹70', 'LAD-BIJ-70', 'Size unconfirmed on poster', 0, '₹70', 6000, 7000, '[6000, 7000]', 'Printed ₹70 option on poster; exact size mapping unconfirmed', 7000, 'PRINTED_ESTIMATE', 'DEMO_NUMERIC', 100, 1),
    ('var_lanka_180', 'prod_big_lanka_laddi', 'Printed Option: ₹180', 'LAD-LNK-180', 'Size unconfirmed on poster', 0, '₹180', 18000, 55000, '[18000, 21000, 55000]', 'Printed ₹180 option on poster; exact size mapping unconfirmed', 18000, 'PRINTED_ESTIMATE', 'DEMO_NUMERIC', 100, 1),
    ('var_lanka_210', 'prod_big_lanka_laddi', 'Printed Option: ₹210', 'LAD-LNK-210', 'Size unconfirmed on poster', 0, '₹210', 18000, 55000, '[18000, 21000, 55000]', 'Printed ₹210 option on poster; exact size mapping unconfirmed', 21000, 'PRINTED_ESTIMATE', 'DEMO_NUMERIC', 100, 1),
    ('var_lanka_550', 'prod_big_lanka_laddi', 'Printed Option: ₹550', 'LAD-LNK-550', 'Size unconfirmed on poster', 0, '₹550', 18000, 55000, '[18000, 21000, 55000]', 'Printed ₹550 option on poster; exact size mapping unconfirmed', 55000, 'PRINTED_ESTIMATE', 'DEMO_NUMERIC', 100, 1);

-- Category 2 Variants: Skyshots
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_pandav_5pcs', 'prod_pandav', '5 pcs pack', 'SKY-PAN-5', '5 pcs', 1, '₹200 to ₹250', 20000, 25000, NULL, 'Printed as ₹200 to ₹250 price range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_single_shot_std', 'prod_single_shot', 'Standard Unit', 'SKY-SNG-1', 'Standard Unit', 0, '₹120', 12000, 12000, NULL, 'Printed exact price ₹120 on poster', 12000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_bigboss_3pcs', 'prod_skyshot_bigboss', '3 pcs pack', 'SKY-BB-3', '3 pcs', 1, '₹350', 35000, 35000, NULL, 'Printed exact price ₹350 on poster; pack is 3 pcs', 35000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_jj_3pcs', 'prod_skyshot_jj', '3 pcs pack', 'SKY-JJ-3', '3 pcs', 1, '₹400 to ₹450', 40000, 45000, NULL, 'Printed as ₹400 to ₹450 range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_elephant_3pcs', 'prod_skyshot_elephant', '3 pcs pack', 'SKY-ELE-3', '3 pcs', 1, '₹550 to ₹600', 55000, 60000, NULL, 'Printed as ₹550 to ₹600 range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1);

-- Category 3 Variants: Bombs
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_bullet_10pcs', 'prod_bullet_bomb', '10 pcs box', 'BMB-BLT-10', '10 pcs', 1, '₹80 to ₹100', 8000, 10000, NULL, 'Printed as ₹80 to ₹100 range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_laxmi_50pcs', 'prod_laxmi_paper_bomb', '50 pcs box', 'BMB-LXM-50', '50 pcs', 1, '₹240', 24000, 24000, NULL, 'Printed exact price ₹240 on poster for 50 pcs box', 24000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_kingkong_naji_10pcs', 'prod_kingkong_naji', '10 pcs box', 'BMB-KKN-10', '10 pcs', 1, '₹250', 25000, 25000, NULL, 'Printed exact price ₹250 on poster for 10 pcs box', 25000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_jurassic_10pcs', 'prod_jurassic_bomb', '10 pcs box', 'BMB-JUR-10', '10 pcs', 1, '₹200 to ₹220', 20000, 22000, NULL, 'Printed as ₹200 to ₹220 range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_marshal_10pcs', 'prod_marshal_bomb', '10 pcs box', 'BMB-MAR-10', '10 pcs', 1, '₹200 to ₹220', 20000, 22000, NULL, 'Printed as ₹200 to ₹220 range on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_tiger_sz3', 'prod_tiger_bomb', 'Size 3', 'BMB-TIG-SZ3', 'Per box', 0, '₹200 to ₹400 range', 20000, 40000, NULL, 'Exact price mapping for Size 3 is not supplied on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'UNCONFIRMED_MAPPING', 100, 1),
    ('var_tiger_sz4', 'prod_tiger_bomb', 'Size 4', 'BMB-TIG-SZ4', 'Per box', 0, '₹200 to ₹400 range', 20000, 40000, NULL, 'Exact price mapping for Size 4 is not supplied on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'UNCONFIRMED_MAPPING', 100, 1),
    ('var_tiger_sz5', 'prod_tiger_bomb', 'Size 5', 'BMB-TIG-SZ5', 'Per box', 0, '₹200 to ₹400 range', 20000, 40000, NULL, 'Exact price mapping for Size 5 is not supplied on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'UNCONFIRMED_MAPPING', 100, 1),
    ('var_tiger_sz6', 'prod_tiger_bomb', 'Size 6', 'BMB-TIG-SZ6', 'Per box', 0, '₹200 to ₹400 range', 20000, 40000, NULL, 'Exact price mapping for Size 6 is not supplied on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'UNCONFIRMED_MAPPING', 100, 1),
    ('var_tiger_xxxl_std', 'prod_tiger_xxxl_bomb', 'Per Box', 'BMB-TIG-XXXL', 'Per box', 0, '₹500', 50000, 50000, NULL, 'Printed exact price ₹500 on poster per box', 50000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1);

-- Category 4 Variants: Jharjhari & Sparklers
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_sparklers_9cm_box', 'prod_sparklers_9cm', '10 pkts × 10 pcs', 'SPK-9CM-STD', '10 pkts × 10 pcs', 0, '₹180', 18000, 18000, NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.', 18000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_sparklers_9cm_col_box', 'prod_sparklers_9cm_color', '10 pkts × 10 pcs', 'SPK-9CM-COL', '10 pkts × 10 pcs', 0, '₹250', 25000, 25000, NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.', 25000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_sparklers_12cm_box', 'prod_sparklers_12cm', '10 pkts × 10 pcs', 'SPK-12CM-STD', '10 pkts × 10 pcs', 0, '₹250', 25000, 25000, NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.', 25000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_sparklers_12cm_col_box', 'prod_sparklers_12cm_color', '10 pkts × 10 pcs', 'SPK-12CM-COL', '10 pkts × 10 pcs', 0, '₹300', 30000, 30000, NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.', 30000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_sparklers_15cm_crk_box', 'prod_sparklers_15cm_crackling', '10 pkts × 10 pcs', 'SPK-15CM-CRK', '10 pkts × 10 pcs', 0, '₹350', 35000, 35000, NULL, 'Poster original footnote: "All packs include 10 packets, each containing 10 pieces." Flagged for confirmation.', 35000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1);

-- Category 5 Variants: Kumpi & Chakri
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_kumpi_medium', 'prod_kumpi_pots', 'Kumpi Medium', 'KMP-MED-BX', 'Per box', 0, '₹150 to ₹200 per box', 15000, 20000, NULL, 'Printed as ₹150 to ₹200 per box on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_kumpi_large', 'prod_kumpi_pots', 'Kumpi Large', 'KMP-LRG-BX', 'Per box', 0, '₹200 to ₹250 per box', 20000, 25000, NULL, 'Printed as ₹200 to ₹250 per box on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_chakri_medium', 'prod_chakri_spinners', 'Chakri Medium', 'CHK-MED-BX', 'Per box', 0, '₹100 per box', 10000, 10000, NULL, 'Printed exact price ₹100 per box on poster', 10000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1),
    ('var_chakri_large', 'prod_chakri_spinners', 'Chakri Large', 'CHK-LRG-BX', 'Per box', 0, '₹250 to ₹350 per box', 25000, 35000, NULL, 'Printed as ₹250 to ₹350 per box on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1);

-- Category 6 Variants: Others
INSERT OR IGNORE INTO product_variants (id, product_id, variant_name, sku, pack_info, is_pack_verified, printed_price_text, printed_min_paise, printed_max_paise, printed_options_json, source_notes, demo_price_paise, price_status, pricing_origin, stock_quantity, is_available) VALUES
    ('var_helicopter_box', 'prod_helicopter', 'Helicopter Box', 'OTH-HEL-BX', 'Per box', 0, '₹150 to ₹200 per box', 15000, 20000, NULL, 'Printed as ₹150 to ₹200 per box on poster (unresolved demo price)', NULL, 'PRICE_ON_ENQUIRY', 'POSTER_RANGE', 100, 1),
    ('var_ganga_jamuna_box', 'prod_ganga_jamuna', 'Ganga Jamuna Box', 'OTH-GJ-BX', 'Per box', 0, '₹150 per box', 15000, 15000, NULL, 'Printed exact price ₹150 per box on poster', 15000, 'PRINTED_ESTIMATE', 'POSTER_EXACT', 100, 1);
