import React, { useState, useRef } from 'react';
import {
  CartItem,
  CartTotals,
  SimulatedPaymentStatus,
  DemoOrderRecord,
} from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from '../utils/formatters';
import { generateEnquiryText, getWhatsAppUrl } from '../utils/enquirySummary';

interface ReviewViewProps {
  customer: CustomerDetails;
  items: CartItem[];
  totals: CartTotals;
  onEditCustomer: () => void;
  onEditCart: () => void;
  onResetOrder?: () => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  customer,
  items,
  totals,
  onEditCustomer,
  onEditCart,
  onResetOrder,
}) => {
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] =
    useState<SimulatedPaymentStatus>('NOT_STARTED');
  const [demoOrder, setDemoOrder] = useState<DemoOrderRecord | null>(null);

  // Idempotency lock to prevent duplicate order generation on rapid clicks
  const isSubmittingRef = useRef(false);

  const isCustomerValid =
    customer.fullName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(customer.mobileNumber.trim()) &&
    customer.ageConfirmed;

  const canProceedToPayment =
    isCustomerValid &&
    totals.totalQuantity > 0 &&
    totals.minOrderRequirementMet &&
    !totals.hasUnpricedItems;

  const currentOrderId = demoOrder?.demoOrderId;
  const summaryText = generateEnquiryText(customer, items, totals, currentOrderId);
  const whatsappUrl = getWhatsAppUrl(summaryText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setCopied(false);
    }
  };

  // Start simulated payment flow
  const handleInitiatePayment = () => {
    if (!canProceedToPayment) return;
    setPaymentStatus('PENDING');
  };

  // Simulate successful payment (idempotent)
  const handleSimulateSuccess = () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // Retain existing order ID if already generated
    const orderId =
      demoOrder?.demoOrderId ||
      `DEMO-NT-${Math.floor(1000 + Math.random() * 9000)}`;

    const record: DemoOrderRecord = {
      demoOrderId: orderId,
      createdAt: new Date().toISOString(),
      customerName: customer.fullName,
      customerMobile: customer.mobileNumber,
      items,
      subtotalPaise: totals.subtotalPaise,
      tokenAmountPaise: totals.tokenAmountPaise,
      remainingBalancePaise: totals.remainingBalancePaise,
      paymentStatus: 'SUCCESS',
      isSimulatedDemo: true,
    };

    setDemoOrder(record);
    setPaymentStatus('SUCCESS');
    isSubmittingRef.current = false;
  };

  // Simulate payment failure
  const handleSimulateFailure = () => {
    setPaymentStatus('FAILED');
  };

  // Retry payment after simulated failure
  const handleRetryPayment = () => {
    setPaymentStatus('PENDING');
  };

  // Cancel simulated payment and return to review
  const handleCancelPayment = () => {
    setPaymentStatus('NOT_STARTED');
  };

  // ── SCREEN STATE 1: SIMULATED PAYMENT SUCCESS (DEMO CONFIRMATION) ──
  if (paymentStatus === 'SUCCESS' && demoOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Explicit Portfolio Demo Banner */}
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 space-y-1">
          <p className="font-bold text-amber-300 flex items-center gap-1.5">
            <span>ℹ️</span> Portfolio Demo Notice
          </p>
          <p className="font-semibold text-sm">
            Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
          </p>
          <p className="text-[11px] text-amber-200/80">
            No money was received or deducted from your account. This screen demonstrates a simulated order confirmation for an engineering portfolio project.
          </p>
        </div>

        {/* Success Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-bg-surface border border-emerald-500/30 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
            ✓
          </div>
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              Simulated Payment Completed
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-content-primary">
              Demo Order Confirmation
            </h2>
            <p className="text-xs text-content-muted mt-1">
              Demo Reference:{' '}
              <span className="font-mono font-bold text-content-primary">
                {demoOrder.demoOrderId}
              </span>
            </p>
          </div>

          {/* Financial Summary */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-bg-base border border-white/5 text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-content-muted">Order Subtotal:</span>
              <span className="text-content-primary font-bold">
                {formatPaise(demoOrder.subtotalPaise)}
              </span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>Simulated Token Paid:</span>
              <span className="font-bold">
                {formatPaise(demoOrder.tokenAmountPaise)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-white/10 text-festive-amber">
              <span>Remaining Balance:</span>
              <span className="font-bold">
                {formatPaise(demoOrder.remainingBalancePaise)}
              </span>
            </div>
          </div>

          {/* Copy Summary Action */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={handleCopy}
              className={`min-h-touch px-6 py-3 rounded-xl font-semibold text-sm transition-transform active:scale-95 flex items-center justify-center gap-2 border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-festive-marigold hover:bg-festive-marigold-hover text-black border-festive-marigold'
              }`}
            >
              {copied ? '✓ Copied to Clipboard!' : '📋 Copy Demo Order Summary'}
            </button>

            {onResetOrder && (
              <button
                type="button"
                onClick={onResetOrder}
                className="min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors"
              >
                Start New Demo Order
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN STATE 2: SIMULATED PAYMENT PENDING / FAILURE MODAL VIEW ──
  if (paymentStatus === 'PENDING' || paymentStatus === 'FAILED') {
    return (
      <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Explicit Portfolio Demo Banner */}
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 space-y-1">
          <p className="font-bold text-amber-300 flex items-center gap-1.5">
            <span>ℹ️</span> Portfolio Demo Notice
          </p>
          <p className="font-semibold text-sm">
            Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
          </p>
        </div>

        <div className="p-6 md:p-8 rounded-2xl bg-bg-surface border border-white/10 space-y-6 text-center shadow-2xl">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-festive-amber border border-amber-500/30 mb-2">
              Simulated Payment Gateway Demo
            </span>
            <h2 className="text-2xl font-bold font-display text-content-primary">
              Fixed ₹100 Demo Token Payment
            </h2>
            <p className="text-xs text-content-muted mt-1">
              Simulated token reservation amount:{' '}
              <strong className="text-festive-amber font-mono text-base">
                {formatPaise(totals.tokenAmountPaise)}
              </strong>
            </p>
          </div>

          {paymentStatus === 'PENDING' ? (
            <div className="p-5 rounded-xl bg-bg-base border border-white/5 space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-festive-marigold border-t-transparent animate-spin" />
              <p className="text-sm font-semibold text-content-primary">
                Simulating Payment Authorization...
              </p>
              <p className="text-xs text-content-muted leading-relaxed max-w-sm mx-auto">
                No real UPI intent or bank API is contacted. Use the buttons
                below to test success or error response states:
              </p>
            </div>
          ) : (
            <div className="p-5 rounded-xl bg-red-950/30 border border-red-800/40 space-y-2 text-left text-xs text-red-200">
              <p className="font-bold text-sm text-red-300 flex items-center gap-1.5">
                <span>⚠️</span> Simulated Payment Failed
              </p>
              <p>
                This error state demonstrates how transaction timeouts, bank
                declines, or user cancellation are handled. No funds were
                charged.
              </p>
            </div>
          )}

          {/* Test Action Controls */}
          <div className="space-y-3 pt-2">
            {paymentStatus === 'PENDING' ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSimulateSuccess}
                  className="flex-1 min-h-touch px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-sm transition-transform shadow-lg shadow-emerald-900/20"
                >
                  Simulate Successful Payment (Test Success)
                </button>
                <button
                  type="button"
                  onClick={handleSimulateFailure}
                  className="flex-1 min-h-touch px-6 py-3 rounded-xl bg-red-950/60 hover:bg-red-900/60 active:scale-95 text-red-200 font-semibold text-sm transition-colors border border-red-800/50"
                >
                  Simulate Payment Failure (Test Error)
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRetryPayment}
                className="w-full min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-sm transition-transform"
              >
                Retry Simulated Payment
              </button>
            )}

            <button
              type="button"
              onClick={handleCancelPayment}
              className="w-full text-xs text-content-muted hover:text-content-primary py-2 transition-colors"
            >
              ← Cancel and Return to Review Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── SCREEN STATE 3: DRAFT REVIEW & SIMULATED SUBMISSION ──
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Explicit Portfolio Demo Banner */}
      <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-200 space-y-1">
        <p className="font-bold text-amber-300 flex items-center gap-1.5">
          <span>ℹ️</span> Portfolio Demo Notice
        </p>
        <p className="font-semibold text-sm">
          Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
        </p>
        <p className="text-[11px] text-amber-200/80">
          This simulated checkout demonstrates an online order calculation with a fixed ₹100 token deposit rule.
        </p>
      </div>

      {/* Screen Title */}
      <div>
        <h2 className="text-2xl font-bold font-display text-content-primary">
          Simulated Checkout & Review
        </h2>
        <p className="text-xs text-content-muted mt-1 leading-relaxed">
          Review your sample customer details, selected fireworks, fixed ₹100 demo
          token, and remaining balance below.
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
                    On enquiry ({item.printedPriceText})
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
          Estimated Valuation (Integer Paise)
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-content-muted">
              Priced Items Subtotal ({totals.pricedItemCount} items)
            </span>
            <span className="font-mono font-bold text-content-primary text-sm">
              {formatPaise(totals.subtotalPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-content-muted">
              Fixed Demo Token Amount
            </span>
            <span className="font-mono font-bold text-festive-amber text-sm">
              {formatPaise(totals.tokenAmountPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-content-muted">
              Remaining Balance (Subtotal - Token)
            </span>
            <span className="font-mono font-bold text-content-primary text-sm">
              {formatPaise(totals.remainingBalancePaise)}
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
              Portfolio Demo Only. No real orders, fireworks sales, delivery, or payments are processed.
            </p>
          </div>
          <span className="text-2xl font-bold font-mono text-festive-amber">
            {formatPaise(totals.subtotalPaise)}
          </span>
        </div>
      </div>

      {/* Edge Case Blocking Feedback */}
      {totals.hasUnpricedItems && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 space-y-1">
          <p className="font-bold">⚠️ Unpriced Items in Box:</p>
          <p>
            Every item in your box must have a confirmed price before proceeding to simulated payment.
          </p>
        </div>
      )}

      {!totals.minOrderRequirementMet && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300 space-y-1">
          <p className="font-bold">ℹ️ Minimum Order Not Reached:</p>
          <p>
            Add items until your subtotal reaches ₹100. The demo token amount is fixed at ₹100.
          </p>
        </div>
      )}

      {/* Simulated Submission Action */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-4">
        <h3 className="text-sm font-bold font-display text-content-primary">
          Demo Checkout Action
        </h3>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleInitiatePayment}
            disabled={!canProceedToPayment}
            className={`flex-1 min-h-touch px-6 py-3.5 rounded-xl font-semibold text-base transition-transform flex items-center justify-center gap-2 ${
              canProceedToPayment
                ? 'bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black shadow-lg shadow-amber-500/10 cursor-pointer'
                : 'bg-white/10 text-content-muted cursor-not-allowed border border-white/10'
            }`}
          >
            <span>Proceed to Simulated Payment (₹100 Demo Token) →</span>
          </button>
        </div>

        {totals.checkoutBlockedReason && (
          <p className="text-xs text-amber-400 font-medium text-center">
            {totals.checkoutBlockedReason}
          </p>
        )}
      </div>

      {/* Summary Preparation & Actions */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-4">
        <h3 className="text-sm font-bold font-display text-content-primary">
          Demo Summary Slip
        </h3>

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
                <span>Copy Demo Summary</span>
              </>
            )}
          </button>

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
              <span>(WhatsApp direct link not configured. Use Copy button above.)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
