import { CartItem, CartTotals } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from './formatters';

export function generateEnquiryText(
  customer: CustomerDetails,
  items: CartItem[],
  totals: CartTotals,
  demoOrderId?: string
): string {
  const lines: string[] = [];

  lines.push('=========================================');
  lines.push('   NAGARJUNA TRADERS — PORTFOLIO DEMO');
  lines.push('   SIMULATED DIWALI ORDER SUMMARY');
  lines.push('=========================================');
  if (demoOrderId) {
    lines.push(`DEMO ORDER REF: ${demoOrderId}`);
    lines.push('STATUS: SIMULATED DEMO RECORD');
  }
  lines.push('');
  lines.push('SAMPLE CUSTOMER DETAILS:');
  lines.push(`• Name: ${customer.fullName}`);
  lines.push(`• Mobile: ${customer.mobileNumber}`);
  lines.push(
    `• Preference: ${
      customer.fulfilmentPreference === 'COUNTER_PICKUP'
        ? 'Simulated Store Counter Pickup'
        : 'Simulated Wholesale Enquiry'
    }`
  );
  if (customer.notes.trim()) {
    lines.push(`• Notes: ${customer.notes.trim()}`);
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
        `   Price: Requires Confirmation (Printed: ${item.printedPriceText})`
      );
    }
    lines.push('');
  });

  lines.push('FINANCIAL SUMMARY (INTEGER PAISE):');
  lines.push(`• Order Subtotal: ${formatPaise(totals.subtotalPaise)}`);
  lines.push(`• Fixed Demo Token: ${formatPaise(totals.tokenAmountPaise)}`);
  lines.push(`• Remaining Balance: ${formatPaise(totals.remainingBalancePaise)}`);
  if (totals.unpricedItemCount > 0) {
    lines.push(
      `• Items Needing Price Confirmation: ${totals.unpricedItemCount} item(s)`
    );
  }
  lines.push(`• Total Items: ${totals.totalQuantity} unit(s)`);
  lines.push('');
  lines.push('PORTFOLIO DEMO NOTICE:');
  lines.push(
    'Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed. All amounts and order states shown are simulated.'
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
