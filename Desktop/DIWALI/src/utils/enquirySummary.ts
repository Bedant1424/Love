import { CartItem, CartTotals } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from './formatters';

export function generateEnquiryText(
  customer: CustomerDetails,
  items: CartItem[],
  totals: CartTotals,
  orderRef?: string
): string {
  const lines: string[] = [];

  lines.push('=========================================');
  lines.push('          NAGARJUNA TRADERS');
  lines.push('         DIWALI ORDER ENQUIRY');
  lines.push('=========================================');
  if (orderRef) {
    lines.push(`ORDER REFERENCE: ${orderRef}`);
    lines.push('STATUS: SUBMITTED');
  }
  lines.push('');
  lines.push('CUSTOMER DETAILS:');
  lines.push(`• Name: ${customer.fullName}`);
  lines.push(`• Mobile: ${customer.mobileNumber}`);
  lines.push(
    `• Fulfilment: ${
      customer.fulfilmentPreference === 'HOSTEL_PICKUP'
        ? 'Hostel Pickup'
        : 'Campus Pickup'
    }`
  );
  if (customer.notes.trim()) {
    lines.push(`• Instructions: ${customer.notes.trim()}`);
  }
  lines.push('');
  lines.push('SELECTED ITEMS:');

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName}`);
    lines.push(`   Variant: ${item.variantName} (${item.packInfo})`);
    lines.push(`   Quantity: ${item.quantity}`);
    if (item.lineSubtotalPaise !== null) {
      lines.push(
        `   Subtotal: ${formatPaise(item.lineSubtotalPaise)} (${formatPaise(
          item.pricePaise
        )} each)`
      );
    } else {
      lines.push(
        `   Price: Confirmation upon pickup (Printed: ${item.printedPriceText})`
      );
    }
    lines.push('');
  });

  lines.push('FINANCIAL SUMMARY:');
  lines.push(`• Subtotal: ${formatPaise(totals.subtotalPaise)}`);
  lines.push(`• Advance Booking Token: ${formatPaise(totals.tokenAmountPaise)}`);
  lines.push(`• Remaining Balance upon Pickup: ${formatPaise(totals.remainingBalancePaise)}`);
  if (totals.unpricedItemCount > 0) {
    lines.push(
      `• Items Needing Price Confirmation: ${totals.unpricedItemCount} item(s)`
    );
  }
  lines.push(`• Total Items: ${totals.totalQuantity} unit(s)`);
  lines.push('');
  lines.push('Make every celebration a little brighter.');
  lines.push('=========================================');

  return lines.join('\n');
}

/**
 * Returns a WhatsApp URL if a valid WhatsApp URL is provided or configured in VITE_WHATSAPP_ENQUIRY_URL.
 * Returns null if the URL is missing or empty.
 */
export function getWhatsAppUrl(
  summaryText: string,
  configuredBaseUrl?: string
): string | null {
  const envUrl = (
    configuredBaseUrl !== undefined
      ? configuredBaseUrl
      : (import.meta.env.VITE_WHATSAPP_ENQUIRY_URL || '')
  ).trim();
  if (!envUrl) {
    return null;
  }

  try {
    const encoded = encodeURIComponent(summaryText);
    if (envUrl.includes('?')) {
      return `${envUrl}&text=${encoded}`;
    }
    return `${envUrl}?text=${encoded}`;
  } catch {
    return null;
  }
}
