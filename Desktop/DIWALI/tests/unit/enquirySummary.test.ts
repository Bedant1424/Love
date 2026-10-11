import { describe, it, expect } from 'vitest';
import { generateEnquiryText, getWhatsAppUrl } from '../../src/utils/enquirySummary';
import { CartItem, CartTotals } from '../../src/types/cart';
import { CustomerDetails } from '../../src/types/customer';

describe('Enquiry Summary Utility', () => {
  const sampleCustomer: CustomerDetails = {
    fullName: 'Ravi Kumar',
    mobileNumber: '9876543210',
    fulfilmentPreference: 'COUNTER_PICKUP',
    ageConfirmed: true,
    notes: 'Visiting counter at 4 PM',
  };

  const sampleItems: CartItem[] = [
    {
      productId: 'prod_skyshot_bigboss',
      variantId: 'var_bigboss_3pcs',
      productName: 'Skyshot - Bigboss',
      variantName: '3 pcs pack',
      packInfo: '3 pcs',
      isPackInfoVerified: true,
      pricePaise: 35000,
      printedPriceText: '₹350',
      priceStatus: 'PRINTED_ESTIMATE',
      quantity: 2,
      lineSubtotalPaise: 70000,
    },
    {
      productId: 'prod_pandav',
      variantId: 'var_pandav_5pcs',
      productName: 'Pandav',
      variantName: '5 pcs pack',
      packInfo: '5 pcs',
      isPackInfoVerified: true,
      pricePaise: null,
      printedPriceText: '₹200 to ₹250',
      priceStatus: 'PRICE_ON_ENQUIRY',
      quantity: 1,
      lineSubtotalPaise: null,
    },
  ];

  const sampleTotals: CartTotals = {
    totalQuantity: 3,
    pricedItemCount: 1,
    unpricedItemCount: 1,
    provisionalSubtotalPaise: 70000,
  };

  it('generates a clean human-readable enquiry text containing customer and item details', () => {
    const text = generateEnquiryText(sampleCustomer, sampleItems, sampleTotals);

    expect(text).toContain('NAGARJUNA TRADERS');
    expect(text).toContain('Ravi Kumar');
    expect(text).toContain('9876543210');
    expect(text).toContain('Skyshot - Bigboss');
    expect(text).toContain('₹700.00');
    expect(text).toContain('Pandav');
    expect(text).toContain('Requires Confirmation (Printed: ₹200 to ₹250)');
    expect(text).toContain('Known-Price Items Subtotal: ₹700.00');
    expect(text).toContain('Items Requiring Price Confirmation: 1 item(s)');
    expect(text).toContain('STATUTORY NOTICE:');
    expect(text).toContain('Online firecracker sales and courier parcel delivery are prohibited under Indian law');
  });

  describe('WhatsApp URL Generator', () => {
    it('returns null when configured URL is empty or whitespace (does not invent link)', () => {
      expect(getWhatsAppUrl('sample text', '')).toBeNull();
      expect(getWhatsAppUrl('sample text', '   ')).toBeNull();
    });

    it('returns valid encoded WhatsApp URL when a valid base URL is configured', () => {
      const url = getWhatsAppUrl('Hello World', 'https://wa.me/919876543210');
      expect(url).toBe('https://wa.me/919876543210?text=Hello%20World');
    });

    it('handles query parameters cleanly in configured base URL', () => {
      const url = getWhatsAppUrl('Hello World', 'https://api.whatsapp.com/send?phone=919876543210');
      expect(url).toBe('https://api.whatsapp.com/send?phone=919876543210&text=Hello%20World');
    });
  });
});
