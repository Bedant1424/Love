import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { handleApiRequest } from '../../src/server/api';
import { globalMemoryDb } from '../../src/server/db';
import { TrackOrderView } from '../../src/components/TrackOrderView';
import { ProductCard } from '../../src/components/ProductCard';
import { Product } from '../../src/types/catalogue';

describe('Order Tracking and Production Polish Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalMemoryDb.seed(100);
  });

  describe('API: POST /api/v1/orders/track & OTP Endpoints', () => {
    it('returns order details for valid reference and matching mobile number', async () => {
      // 1. Create an order first
      const createReq = new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Rajesh Sharma',
            mobileNumber: '9876543210',
            fulfilmentPreference: 'CAMPUS_PICKUP',
            ageConfirmed: true,
          },
          items: [{ variantId: 'var_bijli_50', quantity: 2 }],
        }),
      });

      const createRes = await handleApiRequest(createReq);
      const createJson = await createRes.json();
      expect(createJson.success).toBe(true);
      const orderRef = createJson.data.orderReference;

      // 2. Track order with correct mobile
      const trackReq = new Request('http://localhost/api/v1/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: orderRef,
          mobileNumber: '9876543210',
        }),
      });

      const trackRes = await handleApiRequest(trackReq);
      expect(trackRes.status).toBe(200);
      const trackJson = await trackRes.json();
      expect(trackJson.success).toBe(true);
      expect(trackJson.data.order_reference).toBe(orderRef);
      expect(trackJson.data.customer_name).toBe('Rajesh Sharma');
      expect(trackJson.data.items.length).toBe(1);
      expect(trackJson.data.items[0].product_name_snapshot).toBeDefined();
    });

    it('rejects order tracking when mobile number does not match', async () => {
      const trackReq = new Request('http://localhost/api/v1/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: 'NT-9999',
          mobileNumber: '9123456789',
        }),
      });

      const trackRes = await handleApiRequest(trackReq);
      expect(trackRes.status).toBe(404);
      const trackJson = await trackRes.json();
      expect(trackJson.success).toBe(false);
      expect(trackJson.error.code).toBe('ORDER_NOT_FOUND');
    });

    it('generates OTP and retrieves orders for registered mobile', async () => {
      // 1. Create order for customer
      const createReq = new Request('http://localhost/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            fullName: 'Anita Devi',
            mobileNumber: '9811122233',
            fulfilmentPreference: 'CAMPUS_PICKUP',
            ageConfirmed: true,
          },
          items: [{ variantId: 'var_bijli_50', quantity: 1 }],
        }),
      });
      await handleApiRequest(createReq);

      // 2. Request OTP
      const otpReq = new Request('http://localhost/api/v1/orders/track/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: '9811122233' }),
      });
      const otpRes = await handleApiRequest(otpReq);
      expect(otpRes.status).toBe(200);
      const otpJson = await otpRes.json();
      expect(otpJson.success).toBe(true);
      expect(otpJson.data.devOtp).toBeDefined(); // restricted test mode returns devOtp
      const generatedOtp = otpJson.data.devOtp;

      // 3. Verify OTP
      const verifyReq = new Request('http://localhost/api/v1/orders/track/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobileNumber: '9811122233',
          otp: generatedOtp,
        }),
      });
      const verifyRes = await handleApiRequest(verifyReq);
      expect(verifyRes.status).toBe(200);
      const verifyJson = await verifyRes.json();
      expect(verifyJson.success).toBe(true);
      expect(verifyJson.data.orders.length).toBeGreaterThanOrEqual(1);
      expect(verifyJson.data.orders[0].customer_mobile).toBe('9811122233');
    });
  });

  describe('Component: TrackOrderView', () => {
    it('renders initial lookup form and handles submission', async () => {
      const mockNav = vi.fn();
      render(<TrackOrderView onNavigateToCatalogue={mockNav} />);

      expect(screen.getByText('Track Your Diwali Order')).toBeInTheDocument();
      expect(screen.getByLabelText(/Order Reference/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Registered 10-Digit Mobile Number/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Track Order Status/i })).toBeInTheDocument();
    });

    it('allows toggling to OTP mode and requesting a code', async () => {
      const mockNav = vi.fn();
      render(<TrackOrderView onNavigateToCatalogue={mockNav} />);

      const otpLink = screen.getByText(/Retrieve via mobile & OTP/i);
      fireEvent.click(otpLink);

      expect(screen.getByText('Retrieve Lost Order Reference')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send 6-Digit Code/i })).toBeInTheDocument();
    });
  });

  describe('Component: ProductCard Contradictory Range Prevention', () => {
    it('displays From minPrice badge for multiple variants and suppresses contradictory range', () => {
      const mockProduct: Product = {
        id: 'prod_tiger_bomb',
        categoryId: 'bombs',
        name: 'Tiger Bomb',
        packInfo: 'Pack of 10',
        isPackInfoVerified: false,
        printedPriceText: '₹350 to ₹400 per box',
        pricingOrigin: 'POSTER_RANGE',
        variants: [
          {
            id: 'var_tiger_size3',
            productId: 'prod_tiger_bomb',
            sku: 'BOM-TIG-3',
            name: 'Size 3',
            packInfo: '',
            isPackInfoVerified: false,
            printedPriceText: '₹350 to ₹400 per box',
            printedMinPaise: 35000,
            printedMaxPaise: 40000,
            demoPricePaise: 25000,
            pricePaise: 25000, // owner override ₹250
            priceStatus: 'CONFIRMED',
            pricingOrigin: 'OWNER_CONFIRMED',
            isAvailable: true,
          },
          {
            id: 'var_tiger_size4',
            productId: 'prod_tiger_bomb',
            sku: 'BOM-TIG-4',
            name: 'Size 4',
            packInfo: '',
            isPackInfoVerified: false,
            printedPriceText: '₹350 to ₹400 per box',
            printedMinPaise: 35000,
            printedMaxPaise: 40000,
            demoPricePaise: 27500,
            pricePaise: 27500,
            priceStatus: 'CONFIRMED',
            pricingOrigin: 'OWNER_CONFIRMED',
            isAvailable: true,
          },
        ],
      };

      const mockQty = vi.fn().mockReturnValue(0);
      const mockAdd = vi.fn();
      const mockInc = vi.fn();
      const mockDec = vi.fn();

      render(
        <ProductCard
          product={mockProduct}
          getItemQuantity={mockQty}
          onAddItem={mockAdd}
          onIncrement={mockInc}
          onDecrement={mockDec}
        />
      );

      // Card badge should show "From ₹250.00"
      expect(screen.getByText('From ₹250.00')).toBeInTheDocument();

      // Because ₹250 is outside ₹350–₹400, contradictory "Range: ₹350 to ₹400 per box" should NOT be displayed
      expect(screen.queryByText('Range: ₹350 to ₹400 per box')).not.toBeInTheDocument();
      expect(screen.getByText('Catalogue Price')).toBeInTheDocument();
      expect(screen.getAllByText('₹250.00').length).toBe(2);
    });
  });
});
