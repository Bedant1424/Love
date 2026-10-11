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

export type PriceStatus =
  | 'PRINTED_ESTIMATE'
  | 'PRICE_ON_ENQUIRY'
  | 'CONFIRMED';

export interface ProductVariant {
  id: string;
  name: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  printedPriceText: string;
  pricePaise: number | null;
  priceStatus: PriceStatus;
  isAvailable: boolean;
  notes?: string;
}

export interface Product {
  id: string;
  categoryId: CategoryId;
  name: string;
  printedPriceText: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  variants: ProductVariant[];
  complianceNotice?: string;
  notes?: string;
}
