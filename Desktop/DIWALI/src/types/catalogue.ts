export type CategoryId =
  | 'laddis'
  | 'skyshots'
  | 'bombs'
  | 'sparklers'
  | 'flowerpots-spinners'
  | 'others';

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  complianceWarning?: string;
  sortOrder: number;
}

/**
 * Distinguishes printed catalogue pricing, unpriced ranges, and demo states.
 */
export type PriceStatus =
  | 'PRINTED_ESTIMATE' // Exact price printed on poster (e.g. ₹180, ₹350)
  | 'PRICE_ON_ENQUIRY' // Printed as price range or unconfirmed mapping (e.g. ₹200 to ₹250)
  | 'PRICE_TO_BE_CONFIRMED' // Unpriced item requiring confirmation before simulated payment
  | 'CONFIRMED'; // Owner-confirmed price

export type PricingOrigin =
  | 'POSTER_EXACT' // Exact printed price on poster
  | 'POSTER_RANGE' // Printed price range on poster
  | 'UNCONFIRMED_MAPPING' // Unconfirmed size/variant mapping
  | 'DEMO_NUMERIC' // Explicit numeric price option derived from poster
  | 'OWNER_CONFIRMED'; // Verified by business owner

export interface ProductVariant {
  id: string;
  productId?: string;
  name: string;
  sku?: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  printedPriceText: string;
  printedMinPaise?: number | null;
  printedMaxPaise?: number | null;
  printedOptionsPaise?: number[];
  sourceNotes?: string;
  demoPricePaise?: number | null;
  pricePaise: number | null; // Keeps backward compatibility with existing components
  priceStatus: PriceStatus;
  pricingOrigin: PricingOrigin;
  isAvailable: boolean;
  stockQuantity?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  printedPriceText: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  pricingOrigin: PricingOrigin;
  variants: ProductVariant[];
  complianceNotice?: string;
  notes?: string;
}
