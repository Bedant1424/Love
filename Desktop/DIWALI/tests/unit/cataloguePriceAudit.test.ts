import { describe, it, expect, beforeEach } from 'vitest';
import { PRODUCTS, CATEGORIES } from '../../src/data/catalogueData';
import {
  calculateTokenAmountPaise,
  calculateRemainingBalancePaise,
  TOKEN_TIER_THRESHOLD_PAISE,
  TOKEN_LOW_TIER_PAISE,
  TOKEN_HIGH_TIER_PAISE,
} from '../../src/utils/tokenPolicy';
import { useCart } from '../../src/hooks/useCart';
import { renderHook, act } from '@testing-library/react';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';

describe('Catalogue Price Audit and Variant Selection Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    globalMemoryDb.seed();
    globalMemoryDb.seedSyntheticTestStock(100);
  });

  describe('Poster Price Conformance for All 6 Categories & 29 Variants', () => {
    it('verifies 6 authentic categories exist', () => {
      expect(CATEGORIES.length).toBe(6);
      const catIds = CATEGORIES.map((c) => c.id);
      expect(catIds).toEqual([
        'laddis',
        'skyshots',
        'bombs',
        'sparklers',
        'flowerpots-spinners',
        'others',
      ]);
    });

    it('verifies all 21 products and 29 variants have integer paise prices and valid ranges', () => {
      let variantCount = 0;
      for (const prod of PRODUCTS) {
        expect(prod.variants.length).toBeGreaterThan(0);
        for (const v of prod.variants) {
          variantCount += 1;
          // Must be integer paise
          if (v.pricePaise !== null) {
            expect(Number.isInteger(v.pricePaise)).toBe(true);
            expect(v.pricePaise).toBeGreaterThan(0);
          }
          if (v.printedMinPaise !== null && v.printedMinPaise !== undefined) {
            expect(Number.isInteger(v.printedMinPaise)).toBe(true);
          }
          if (v.printedMaxPaise !== null && v.printedMaxPaise !== undefined) {
            expect(Number.isInteger(v.printedMaxPaise)).toBe(true);
          }

          // Bound enforcement
          if (
            v.pricePaise !== null &&
            v.printedMinPaise !== null &&
            v.printedMinPaise !== undefined &&
            v.printedMaxPaise !== null &&
            v.printedMaxPaise !== undefined &&
            v.pricingOrigin !== 'OWNER_CONFIRMED'
          ) {
            expect(v.pricePaise).toBeGreaterThanOrEqual(v.printedMinPaise);
            expect(v.pricePaise).toBeLessThanOrEqual(v.printedMaxPaise);
          }
        }
      }
      expect(variantCount).toBe(29);
      expect(PRODUCTS.length).toBe(21);
    });

    it('verifies single-price items have min == max == active price', () => {
      const singlePriceVariants = [
        { id: 'var_single_shot_std', expectedPaise: 15000 },
        { id: 'var_kingkong_naji_10pcs', expectedPaise: 38000 },
        { id: 'var_jurassic_10pcs', expectedPaise: 20000 },
        { id: 'var_marshal_10pcs', expectedPaise: 25000 },
        { id: 'var_tiger_xxxl_std', expectedPaise: 55000 },
        { id: 'var_sparklers_9cm_box', expectedPaise: 3000 },
        { id: 'var_sparklers_9cm_col_box', expectedPaise: 4500 },
        { id: 'var_sparklers_12cm_box', expectedPaise: 4500 },
        { id: 'var_sparklers_12cm_col_box', expectedPaise: 5000 },
        { id: 'var_sparklers_15cm_crk_box', expectedPaise: 7000 },
        { id: 'var_chakri_medium', expectedPaise: 12000 },
      ];

      for (const item of singlePriceVariants) {
        let found = false;
        for (const prod of PRODUCTS) {
          const v = prod.variants.find((vr) => vr.id === item.id);
          if (v) {
            found = true;
            expect(v.pricePaise).toBe(item.expectedPaise);
            expect(v.printedMinPaise).toBe(item.expectedPaise);
            expect(v.printedMaxPaise).toBe(item.expectedPaise);
          }
        }
        expect(found).toBe(true);
      }
    });

    it('verifies ranged items have lower bound <= active price <= upper bound', () => {
      const rangedVariants = [
        { id: 'var_pandav_5pcs', min: 18000, max: 20000 },
        { id: 'var_bigboss_3pcs', min: 40000, max: 45000 },
        { id: 'var_jj_3pcs', min: 45000, max: 50000 },
        { id: 'var_elephant_3pcs', min: 55000, max: 60000 },
        { id: 'var_kumpi_medium', min: 19000, max: 20000 },
        { id: 'var_kumpi_large', min: 25000, max: 30000 },
        { id: 'var_chakri_large', min: 20000, max: 30000 },
        { id: 'var_helicopter_box', min: 10000, max: 29000 },
        { id: 'var_ganga_jamuna_box', min: 14000, max: 15000 },
      ];

      for (const item of rangedVariants) {
        let found = false;
        for (const prod of PRODUCTS) {
          const v = prod.variants.find((vr) => vr.id === item.id);
          if (v) {
            found = true;
            expect(v.printedMinPaise).toBe(item.min);
            expect(v.printedMaxPaise).toBe(item.max);
            expect(v.pricePaise).toBeGreaterThanOrEqual(item.min);
            expect(v.pricePaise).toBeLessThanOrEqual(item.max);
          }
        }
        expect(found).toBe(true);
      }
    });

    it('verifies owner-confirmed Tiger Bomb variants match audit prices', () => {
      const tigerVariants = [
        { id: 'var_tiger_sz3', expectedPaise: 25000 },
        { id: 'var_tiger_sz4', expectedPaise: 27500 },
        { id: 'var_tiger_sz5', expectedPaise: 30000 },
        { id: 'var_tiger_sz6', expectedPaise: 35000 },
      ];

      for (const item of tigerVariants) {
        let found = false;
        for (const prod of PRODUCTS) {
          const v = prod.variants.find((vr) => vr.id === item.id);
          if (v) {
            found = true;
            expect(v.pricePaise).toBe(item.expectedPaise);
            expect(v.priceStatus).toBe('CONFIRMED');
            expect(v.pricingOrigin).toBe('OWNER_CONFIRMED');
          }
        }
        expect(found).toBe(true);
      }
    });
  });

  describe('Tiger Bomb Variant Selection and Cart Behavior', () => {
    it('allows independent selection of Tiger Bomb sizes 3, 4, 5, 6', () => {
      const tigerProd = PRODUCTS.find((p) => p.id === 'prod_tiger_bomb');
      expect(tigerProd).toBeDefined();
      expect(tigerProd!.variants.length).toBe(4);

      const variants = tigerProd!.variants;
      expect(variants.map((v) => v.id)).toEqual([
        'var_tiger_sz3',
        'var_tiger_sz4',
        'var_tiger_sz5',
        'var_tiger_sz6',
      ]);
      expect(variants.map((v) => v.name)).toEqual([
        'Size 3',
        'Size 4',
        'Size 5',
        'Size 6',
      ]);
    });

    it('adds specific Tiger Bomb variant to cart and updates line item and totals', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem('prod_tiger_bomb', 'var_tiger_sz4', 2);
      });

      expect(result.current.items.length).toBe(1);
      const item = result.current.items[0];
      expect(item.productId).toBe('prod_tiger_bomb');
      expect(item.variantId).toBe('var_tiger_sz4');
      expect(item.productName).toBe('Tiger Bomb');
      expect(item.variantName).toBe('Size 4');
      expect(item.quantity).toBe(2);
      expect(item.pricePaise).toBe(27500); // ₹275
      expect(item.lineSubtotalPaise).toBe(55000); // ₹550

      // Subtotal >= ₹200 -> token is ₹100 (10000 paise), remaining balance is ₹450 (45000 paise)
      expect(result.current.totals.subtotalPaise).toBe(55000);
      expect(result.current.totals.tokenAmountPaise).toBe(10000);
      expect(result.current.totals.remainingBalancePaise).toBe(45000);
    });

    it('adds multiple different Tiger Bomb sizes as distinct line items', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.addItem('prod_tiger_bomb', 'var_tiger_sz3', 1);
        result.current.addItem('prod_tiger_bomb', 'var_tiger_sz5', 2);
      });

      expect(result.current.items.length).toBe(2);
      expect(result.current.items[0].variantName).toBe('Size 3');
      expect(result.current.items[0].quantity).toBe(1);
      expect(result.current.items[1].variantName).toBe('Size 5');
      expect(result.current.items[1].quantity).toBe(2);

      // Subtotal: 1 * 25000 + 2 * 30000 = 85000 (₹850)
      expect(result.current.totals.subtotalPaise).toBe(85000);
      expect(result.current.totals.tokenAmountPaise).toBe(10000);
      expect(result.current.totals.remainingBalancePaise).toBe(75000);
    });
  });

  describe('Tiered Token Policy and Checkout Boundary Tests', () => {
    it('verifies token tier constants and thresholds', () => {
      expect(TOKEN_TIER_THRESHOLD_PAISE).toBe(20000); // ₹200
      expect(TOKEN_LOW_TIER_PAISE).toBe(5000); // ₹50
      expect(TOKEN_HIGH_TIER_PAISE).toBe(10000); // ₹100
    });

    it('applies ₹50 token for subtotal below ₹200', () => {
      // 9 cm Sparklers: ₹30, 2 packets = ₹60 (< ₹200)
      const subtotal = 6000;
      const token = calculateTokenAmountPaise(subtotal);
      expect(token).toBe(5000);
      const balance = calculateRemainingBalancePaise(subtotal, token);
      expect(balance).toBe(1000); // ₹10
    });

    it('applies ₹100 token for subtotal at or above ₹200', () => {
      // Jurassic Bomb: ₹200 exact boundary
      const subtotal = 20000;
      const token = calculateTokenAmountPaise(subtotal);
      expect(token).toBe(10000);
      const balance = calculateRemainingBalancePaise(subtotal, token);
      expect(balance).toBe(10000); // ₹100
    });

    it('correctly handles boundary at ₹199.99 vs ₹200.00', () => {
      expect(calculateTokenAmountPaise(19999)).toBe(5000);
      expect(calculateRemainingBalancePaise(19999, 5000)).toBe(14999);

      expect(calculateTokenAmountPaise(20000)).toBe(10000);
      expect(calculateRemainingBalancePaise(20000, 10000)).toBe(10000);
    });
  });

  describe('Server-side Order Creation with Correct Snapshots', () => {
    it('snapshots product name and variant name correctly in order items', async () => {
      const orderReq = new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Audit Test Customer',
            mobileNumber: '9876543210',
            fulfilmentPreference: 'CAMPUS_PICKUP',
          },
          items: [
            { variantId: 'var_tiger_sz4', quantity: 1 },
            { variantId: 'var_sparklers_9cm_box', quantity: 2 },
          ],
        }),
      });

      const res = await handleApiRequest(orderReq);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);

      const orderRef = json.data.orderReference;
      const order = await globalMemoryDb.getOrderByReference(orderRef);
      expect(order).toBeDefined();

      const items = order!.items;
      expect(items.length).toBe(2);

      const tigerItem = items.find((it) => it.variant_id === 'var_tiger_sz4');
      expect(tigerItem).toBeDefined();
      expect(tigerItem!.product_name_snapshot).toBe('Tiger Bomb');
      expect(tigerItem!.variant_name_snapshot).toBe('Size 4');
      expect(tigerItem!.unit_price_paise).toBe(27500);

      const sparklerItem = items.find(
        (it) => it.variant_id === 'var_sparklers_9cm_box'
      );
      expect(sparklerItem).toBeDefined();
      expect(sparklerItem!.product_name_snapshot).toBe('9 cm Sparklers');
      expect(sparklerItem!.variant_name_snapshot).toBe('9 cm Sparklers');
      expect(sparklerItem!.unit_price_paise).toBe(3000);
    });
  });
});
