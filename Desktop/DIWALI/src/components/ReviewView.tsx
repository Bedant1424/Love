import React, { useState } from 'react';
import { CartItem, CartTotals } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from '../utils/formatters';
import {
  generateEnquiryText,
  getWhatsAppUrl,
} from '../utils/enquirySummary';

interface ReviewViewProps {
  customer: CustomerDetails;
  items: CartItem[];
  totals: CartTotals;
  onEditCustomer: () => void;
  onEditCart: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  customer,
  items,
  totals,
  onEditCustomer,
  onEditCart,
}) => {
  const [copied, setCopied] = useState(false);
  const isCustomerValid =
    customer.fullName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(customer.mobileNumber.trim()) &&
    customer.ageConfirmed;

  const summaryText = generateEnquiryText(customer, items, totals);
  const whatsappUrl = getWhatsAppUrl(summaryText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback if clipboard API is restricted
      setCopied(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold font-display text-content-primary">
          Enquiry Review & Estimate
        </h2>
        <p className="text-xs text-content-muted mt-1 leading-relaxed">
          Please review your details and selected fireworks below. This enquiry
          is non-binding and serves as an advance reservation slip for licensed
          store collection.
        </p>
      </div>

      {/* Customer Details Card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold font-display text-content-primary">
            Customer Information
          </h3>
          <button
            type="button"
            onClick={onEditCustomer}
            className="text-xs text-festive-marigold hover:underline font-medium"
          >
            Edit Details
          </button>
        </div>

        {isCustomerValid ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-content-muted">Full Name:</span>
              <p className="font-semibold text-content-primary text-sm mt-0.5">
                {customer.fullName}
              </p>
            </div>
            <div>
              <span className="text-content-muted">Mobile Number:</span>
              <p className="font-mono font-semibold text-content-primary text-sm mt-0.5">
                +91 {customer.mobileNumber}
              </p>
            </div>
            <div>
              <span className="text-content-muted">Collection Method:</span>
              <p className="font-medium text-content-secondary mt-0.5">
                {customer.fulfilmentPreference === 'COUNTER_PICKUP'
                  ? 'Store Counter Pickup (Sivakasi)'
                  : 'Wholesale Enquiry'}
              </p>
            </div>
            <div>
              <span className="text-content-muted">Age Attestation:</span>
              <p className="font-medium text-emerald-400 mt-0.5">
                ✓ Confirmed 18+ years of age
              </p>
            </div>
            {customer.notes.trim() && (
              <div className="sm:col-span-2 pt-2 border-t border-white/5">
                <span className="text-content-muted">Special Notes:</span>
                <p className="text-content-secondary mt-0.5 italic">
                  "{customer.notes.trim()}"
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 flex items-center justify-between gap-3">
            <span>
              ⚠️ Contact details are incomplete. Please provide your name,
              phone number, and age confirmation.
            </span>
            <button
              type="button"
              onClick={onEditCustomer}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-festive-marigold text-black font-semibold"
            >
              Fill Details
            </button>
          </div>
        )}
      </div>

      {/* Selected Items Card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="text-sm font-bold font-display text-content-primary">
            Selected Items ({totals.totalQuantity} Units)
          </h3>
          <button
            type="button"
            onClick={onEditCart}
            className="text-xs text-festive-marigold hover:underline font-medium"
          >
            Edit Basket
          </button>
        </div>

        <div className="divide-y divide-white/5 text-xs">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="py-2.5 flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <span className="font-semibold text-content-primary">
                  {item.productName} ({item.variantName})
                </span>
                <span className="text-content-muted ml-2">
                  × {item.quantity}
                </span>
              </div>
              <div className="font-mono text-right shrink-0">
                {item.lineSubtotalPaise !== null ? (
                  <span className="text-content-primary font-bold">
                    {formatPaise(item.lineSubtotalPaise)}
                  </span>
                ) : (
                  <span className="text-festive-amber font-medium">
                    On enquiry
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Estimates Card */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <h3 className="text-sm font-bold font-display text-content-primary border-b border-white/5 pb-3">
          Estimated Valuation
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-content-muted">
              Priced Items Subtotal ({totals.pricedItemCount} items)
            </span>
            <span className="font-mono font-bold text-content-primary text-sm">
              {formatPaise(totals.provisionalSubtotalPaise)}
            </span>
          </div>

          {totals.unpricedItemCount > 0 && (
            <div className="flex justify-between items-center text-festive-amber">
              <span>Items Requiring Store Confirmation</span>
              <span className="font-mono font-bold">
                {totals.unpricedItemCount} item(s)
              </span>
            </div>
          )}
        </div>

        {/* Final Estimate Notice */}
        <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
          <div>
            <span className="text-base font-bold text-content-primary">
              Provisional Subtotal:
            </span>
            <p className="text-[11px] text-content-muted">
              Non-binding estimate. No online payment taken.
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-festive-amber">
            {formatPaise(totals.provisionalSubtotalPaise)}
          </span>
        </div>
      </div>

      {/* Statutory E-Commerce and Compliance Banner */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-200/90 space-y-1.5 leading-relaxed">
        <p className="font-bold text-amber-300">
          ⚖️ Supreme Court E-Commerce & Licensing Notice:
        </p>
        <p>
          In accordance with Indian statutory requirements, door-to-door delivery
          and online commercial sales of fireworks are strictly prohibited.
          Nagarjuna Traders operates in non-binding catalogue enquiry mode
          (<code>COMMERCE_CHECKOUT_ENABLED=false</code>).
        </p>
        <p>
          Please copy or send your enquiry summary below. You may present this
          quotation at our licensed retail counter in Sivakasi to inspect the
          goods, verify prices, and complete in-person purchase.
        </p>
      </div>

      {/* Summary Preparation & Actions */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-4">
        <h3 className="text-sm font-bold font-display text-content-primary">
          Enquiry Actions
        </h3>

        {/* Preformatted Summary Text Box */}
        <div className="relative">
          <textarea
            readOnly
            rows={7}
            value={summaryText}
            className="w-full p-3 rounded-xl bg-bg-base border border-white/10 font-mono text-xs text-content-secondary leading-relaxed focus:outline-none select-all"
            aria-label="Human-readable enquiry summary text"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className={`flex-1 min-h-touch px-6 py-3 rounded-xl font-semibold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 border ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-festive-marigold hover:bg-festive-marigold-hover text-black border-festive-marigold'
            }`}
          >
            {copied ? (
              <>
                <span>✓</span>
                <span>Summary Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Copy Enquiry Summary</span>
              </>
            )}
          </button>

          {/* Optional WhatsApp Link (Only if env is set) */}
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-h-touch px-6 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm transition-transform flex items-center justify-center gap-2 border border-emerald-600"
            >
              <span>💬</span>
              <span>Send via WhatsApp</span>
            </a>
          ) : (
            <div className="flex-1 text-center text-xs text-content-muted flex items-center justify-center p-2 rounded-xl bg-bg-elevated border border-white/5">
              <span>
                (WhatsApp direct link not configured. Please use Copy button
                above.)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
