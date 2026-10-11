/**
 * Formats integer paise into an Indian Rupee currency string.
 * @param paise Amount in integer paise (e.g. 35000 = ₹350.00)
 * @returns Formatted INR string, e.g. "₹350.00", or "Price on enquiry" if null
 */
export function formatPaise(paise: number | null): string {
  if (paise === null || paise === undefined) {
    return 'Price on enquiry';
  }
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parses a rupee string or number to integer paise, avoiding float issues.
 */
export function parseInrToPaise(inr: number | string): number {
  if (typeof inr === 'number') {
    return Math.round(inr * 100);
  }
  const cleaned = inr.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}
