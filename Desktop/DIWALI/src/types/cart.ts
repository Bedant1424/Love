import { PriceStatus } from './catalogue';

export interface StoredCartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface CartItem {
  productId: string;
  variantId: string;
  productName: string;
  variantName: string;
  packInfo: string;
  isPackInfoVerified: boolean;
  pricePaise: number | null;
  printedPriceText: string;
  priceStatus: PriceStatus;
  quantity: number;
  lineSubtotalPaise: number | null;
}

export interface CartTotals {
  totalQuantity: number;
  pricedItemCount: number;
  unpricedItemCount: number;
  provisionalSubtotalPaise: number;
}
