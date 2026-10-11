import { CartItem, CartTotals } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from './formatters';

export function generateEnquiryText(
  customer: CustomerDetails,
  items: CartItem[],
  totals: CartTotals
): string {
  const lines: string[] = [];

  lines.push('=========================================');
  lines.push('   NAGARJUNA TRADERS — DIWALI 2026');
  lines.push('   FESTIVAL CATALOGUE ENQUIRY BASKET');
  lines.push('=========================================');
  lines.push('');
  lines.push('CUSTOMER DETAILS:');
  lines.push(`• Name: ${customer.fullName}`);
  lines.push(`• Mobile: ${customer.mobileNumber}`);
  lines.push(
    `• Fulfilment: ${
      customer.fulfilmentPreference === 'COUNTER_PICKUP'
        ? 'Licensed Store Counter Pickup'
        : 'Special Wholesale Enquiry'
    }`
  );
  if (customer.notes.trim()) {
    lines.push(`• Customer Notes: ${customer.notes.trim()}`);
  }
  lines.push('• Age Attestation: Confirmed 18+ years of age');
  lines.push('');
  lines.push('ENQUIRY BASKET ITEMS:');

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.productName}`);
    lines.push(`   Variant: ${item.variantName} (${item.packInfo})`);
    lines.push(`   Quantity: ${item.quantity}`);
    if (item.lineSubtotalPaise !== null) {
      lines.push(
        `   Estimate: ${formatPaise(item.lineSubtotalPaise)} (${formatPaise(
          item.pricePaise
        )} each)`
      );
    } else {
      lines.push(
        `   Price: Requires Confirmation (Printed: ${item.printedPriceText})`
      );
    }
    lines.push('');
  });

  lines.push('ESTIMATE SUMMARY:');
  lines.push(
    `• Known-Price Items Subtotal: ${formatPaise(
      totals.provisionalSubtotalPaise
    )}`
  );
  if (totals.unpricedItemCount > 0) {
    lines.push(
      `• Items Requiring Price Confirmation: ${totals.unpricedItemCount} item(s)`
    );
  }
  lines.push(`• Total Items in Basket: ${totals.totalQuantity} unit(s)`);
  lines.push('');
  lines.push('STATUTORY NOTICE:');
  lines.push(
    'This enquiry is a non-binding quotation request. Online firecracker sales and courier parcel delivery are prohibited under Indian law. Crackers must be inspected and collected in person at the licensed counter by an adult (18+).'
  );
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
