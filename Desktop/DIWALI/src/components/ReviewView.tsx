import React, { useState, useRef, useEffect } from 'react';
import { CartItem, CartTotals, PaymentStatus } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from '../utils/formatters';
import { generateEnquiryText, getWhatsAppUrl } from '../utils/enquirySummary';
import { apiClient } from '../services/apiClient';
import { PaymentConfig } from '../server/types';
import { TestQrCode } from './TestQrCode';

export type ReviewStep =
  | 'REVIEW'
  | 'QR_PAYMENT'
  | 'UTR_SUBMIT'
  | 'CONFIRMATION'
  | 'ORDER_STATUS';

interface OrderState {
  orderReference: string;
  accessToken: string;
  operationalStatus: string;
  paymentStatus: PaymentStatus;
  subtotalPaise: number;
  tokenDuePaise: number;
  balanceDuePaise: number;
  paymentReference?: string | null;
  paymentSubmittedAt?: string | null;
}

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
  const [currentStep, setCurrentStep] = useState<ReviewStep>('REVIEW');
  const [orderState, setOrderState] = useState<OrderState | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusLookupRef, setStatusLookupRef] = useState('');
  const [statusLookupToken, setStatusLookupToken] = useState('');
  const [statusLookupError, setStatusLookupError] = useState<string | null>(null);
  const [statusPolling, setStatusPolling] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  const isSubmittingOrderRef = useRef(false);

  useEffect(() => {
    apiClient
      .getPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => {
        setPaymentConfig({
          paymentCollectionEnabled: false,
          isRestrictedEnv: false,
          vpa: null,
          accountName: null,
          message: 'Payment instructions are currently unavailable.',
        });
      });
  }, []);

  const isCustomerValid =
    customer.fullName.trim().length >= 2 &&
    /^[6-9]\d{9}$/.test(customer.mobileNumber.trim()) &&
    customer.ageConfirmed;

  const canProceedToPayment =
    isCustomerValid &&
    totals.totalQuantity > 0 &&
    totals.subtotalPaise > 0 &&
    totals.minOrderRequirementMet &&
    !totals.hasUnpricedItems;

  const isPaymentAvailable = Boolean(
    paymentConfig?.paymentCollectionEnabled || paymentConfig?.isRestrictedEnv
  );

  const currentOrderId = orderState?.orderReference;
  const summaryText = generateEnquiryText(
    customer,
    items,
    totals,
    currentOrderId
  );
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

  // Step 6 -> Step 7: Create Order on server and proceed to QR payment instructions
  const handleProceedToQr = async () => {
    if (!canProceedToPayment || isSubmittingOrderRef.current || !isPaymentAvailable) return;
    isSubmittingOrderRef.current = true;
    setIsSubmitting(true);

    try {
      const response = await apiClient.createOrder({
        customer,
        items: items.map((it) => ({
          variantId: it.variantId,
          quantity: it.quantity,
        })),
      });

      setOrderState({
        orderReference: response.orderReference,
        accessToken: response.accessToken,
        operationalStatus: response.operationalStatus,
        paymentStatus: response.paymentStatus,
        subtotalPaise: response.subtotalPaise,
        tokenDuePaise: response.tokenDuePaise,
        balanceDuePaise: response.balanceDuePaise,
      });

      setCurrentStep('QR_PAYMENT');
    } catch (err: any) {
      alert(err.message || 'Failed to initialize order on server.');
    } finally {
      setIsSubmitting(false);
      isSubmittingOrderRef.current = false;
    }
  };

  // Step 7 -> Step 8: Move from QR to UTR submission
  const handleProceedToUtr = () => {
    setCurrentStep('UTR_SUBMIT');
  };

  // Step 8: Submit 12-Digit UTR
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderState) return;

    const trimmed = utrInput.trim();
    if (!/^\d{12}$/.test(trimmed)) {
      setUtrError('UTR must be a string of exactly 12 numeric digits.');
      return;
    }

    setUtrError(null);
    setIsSubmitting(true);

    try {
      const updated = await apiClient.submitUtr(
        orderState.orderReference,
        trimmed,
        orderState.accessToken
      );

      setOrderState((prev) =>
        prev
          ? {
              ...prev,
              paymentReference: updated.paymentReference,
              paymentStatus: updated.paymentStatus,
              paymentSubmittedAt: new Date().toISOString(),
            }
          : null
      );

      setCurrentStep('CONFIRMATION');
    } catch (err: any) {
      setUtrError(err.message || 'Failed to record UTR. Please check digits and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 10: Refresh live order status
  const handleRefreshStatus = async () => {
    if (!orderState) return;
    setStatusPolling(true);
    try {
      const live = await apiClient.getOrderStatus(
        orderState.orderReference,
        orderState.accessToken
      );
      setOrderState((prev) =>
        prev
          ? {
              ...prev,
              operationalStatus: live.operationalStatus,
              paymentStatus: live.paymentStatus,
              paymentReference: live.paymentReference,
              paymentSubmittedAt: live.paymentSubmittedAt,
            }
          : null
      );
    } catch (_err) {
      // keep current state
    } finally {
      setStatusPolling(false);
    }
  };

  // Dedicated lookup by order reference from tracker
  const handleLookupOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusLookupRef.trim()) return;

    setStatusLookupError(null);
    setStatusPolling(true);

    try {
      const live = await apiClient.getOrderStatus(
        statusLookupRef.trim(),
        statusLookupToken.trim() || undefined
      );
      setOrderState({
        orderReference: live.orderReference,
        accessToken: statusLookupToken.trim(),
        operationalStatus: live.operationalStatus,
        paymentStatus: live.paymentStatus,
        subtotalPaise: live.subtotalPaise,
        tokenDuePaise: live.tokenAmountPaise,
        balanceDuePaise: live.remainingBalancePaise,
        paymentReference: live.paymentReference,
        paymentSubmittedAt: live.paymentSubmittedAt,
      });
      setCurrentStep('ORDER_STATUS');
    } catch (err: any) {
      setStatusLookupError(err.message || 'Order reference not found or invalid token.');
    } finally {
      setStatusPolling(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 10: ORDER STATUS TRACKER
  // ══════════════════════════════════════════════════════════════════
  if (currentStep === 'ORDER_STATUS' && orderState) {
    const isUnverified = orderState.paymentStatus === 'RECORDED_UNVERIFIED';

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-content-primary">
              Order Status Tracker
            </h2>
            <p className="text-xs text-content-muted mt-0.5">
              Status for Reference: <span className="font-mono text-festive-marigold font-bold">{orderState.orderReference}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={statusPolling}
            className="px-3.5 py-1.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-xs font-semibold text-content-primary flex items-center gap-1.5 transition-colors"
          >
            <span>{statusPolling ? 'Refreshing...' : '🔄 Refresh Status'}</span>
          </button>
        </div>

        {/* Operational Status Stepper */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-4">
          <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider font-mono">
            Fulfilment Progress
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
            {[
              { key: 'SUBMITTED', label: '1. Submitted' },
              { key: 'CONFIRMED', label: '2. Confirmed' },
              { key: 'PREPARING', label: '3. Packing' },
              { key: 'READY_FOR_PICKUP', label: '4. Ready' },
              { key: 'COMPLETED', label: '5. Completed' },
            ].map((step, idx) => {
              const orderStatuses = [
                'SUBMITTED',
                'CONFIRMED',
                'PREPARING',
                'READY_FOR_PICKUP',
                'COMPLETED',
              ];
              const currentIndex = orderStatuses.indexOf(orderState.operationalStatus);
              const isPastOrCurrent = currentIndex >= idx;
              const isCurrent = orderState.operationalStatus === step.key;

              return (
                <div
                  key={step.key}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    isCurrent
                      ? 'bg-festive-marigold/20 border-festive-marigold text-festive-marigold font-bold shadow-md'
                      : isPastOrCurrent
                      ? 'bg-emerald-950/30 border-emerald-700/40 text-emerald-300 font-medium'
                      : 'bg-bg-elevated/40 border-white/5 text-content-muted'
                  }`}
                >
                  <div className="text-xs font-mono">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Token Status Card */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-content-primary uppercase tracking-wider font-mono">
            Advance Token & Payment State
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-bg-elevated border border-white/5">
              <span className="text-[11px] text-content-muted block">Advance Token</span>
              <span className="text-base font-bold font-mono text-festive-marigold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-bg-elevated border border-white/5">
              <span className="text-[11px] text-content-muted block">Remaining Balance</span>
              <span className="text-base font-bold font-mono text-content-primary">
                {formatPaise(orderState.balanceDuePaise)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-bg-elevated border border-white/5">
              <span className="text-[11px] text-content-muted block">Payment State</span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-1 ${
                  isUnverified
                    ? 'bg-amber-950 text-amber-300 border border-amber-700'
                    : orderState.paymentStatus === 'UNPAID'
                    ? 'bg-bg-elevated text-content-muted border border-white/10'
                    : 'bg-red-950 text-red-300 border border-red-700'
                }`}
              >
                {isUnverified ? 'RECORDED (UNVERIFIED)' : orderState.paymentStatus}
              </span>
            </div>
          </div>

          {orderState.paymentReference && (
            <div className="mt-3 p-3 rounded-xl bg-bg-base border border-white/5 text-xs text-content-secondary space-y-1">
              <div>
                <strong>Submitted 12-Digit UTR:</strong>{' '}
                <span className="font-mono text-festive-amber font-bold">
                  {orderState.paymentReference}
                </span>
              </div>
              <div className="text-[11px] text-content-muted">
                Note: This reference is recorded as unverified. This application does not verify payments or establish receipt of funds.
              </div>
            </div>
          )}
        </div>

        {/* Collection Information */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-2 text-xs text-content-secondary">
          <h3 className="text-sm font-bold text-content-primary font-display">
            Order Collection Information
          </h3>
          <p>
            • Present your order reference <strong className="text-content-primary font-mono">{orderState.orderReference}</strong> and registered mobile number at collection.
          </p>
          <p>
            • Remaining balance of <strong className="text-content-primary font-mono">{formatPaise(orderState.balanceDuePaise)}</strong> is due upon collection.
          </p>
          <p>
            • Age confirmation (18+) required at collection.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentStep('REVIEW')}
            className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
          >
            ← Back to Order Summary
          </button>
          {onResetOrder && (
            <button
              type="button"
              onClick={onResetOrder}
              className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-muted hover:text-content-primary font-semibold text-sm transition-colors text-center"
            >
              Start New Order
            </button>
          )}
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 9: ORDER CONFIRMATION
  // ══════════════════════════════════════════════════════════════════
  if (currentStep === 'CONFIRMATION' && orderState) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Success Card */}
        <div className="p-6 md:p-8 rounded-2xl bg-bg-surface border border-emerald-500/30 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
            ✓
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/40 mb-2">
              <span>🎉</span>
              <span>Order Details Recorded</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-content-primary">
              Order Reference: {orderState.orderReference}
            </h2>
            <p className="text-xs text-content-muted mt-1 font-mono">
              Order Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>

          {/* Payment & UTR Status Callout */}
          <div className="max-w-md mx-auto p-4 rounded-xl bg-bg-elevated border border-white/10 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-content-muted">Customer Name:</span>
              <span className="font-semibold text-content-primary">{customer.fullName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-content-muted">Mobile Number:</span>
              <span className="font-mono text-content-primary">+91 {customer.mobileNumber}</span>
            </div>
            {orderState.paymentReference && (
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-content-muted">Submitted 12-Digit UTR:</span>
                <span className="font-mono text-festive-amber font-bold">
                  {orderState.paymentReference}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-content-muted">Payment Reference Status:</span>
              <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 font-mono font-bold text-[11px] border border-amber-800/60">
                RECORDED_UNVERIFIED
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className="text-content-muted">Advance Token:</span>
              <span className="font-mono font-bold text-festive-marigold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm">
              <span className="font-bold text-content-primary">Balance Due at Collection:</span>
              <span className="font-mono font-bold text-content-primary text-base">
                {formatPaise(orderState.balanceDuePaise)}
              </span>
            </div>
          </div>

          <p className="text-xs text-content-muted max-w-md mx-auto leading-relaxed">
            Your 12-digit UTR has been recorded as unverified. This application does not verify payments or confirm receipt of funds. Please retain your order reference.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('ORDER_STATUS')}
              className="w-full sm:w-auto min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-sm transition-transform shadow-lg shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>Track Live Order Status →</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
            >
              {copied ? '✓ Summary Copied!' : '📋 Copy Order Summary'}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>💬 Share to WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 8: UTR SUBMISSION FORM
  // ══════════════════════════════════════════════════════════════════
  if (currentStep === 'UTR_SUBMIT' && orderState) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-7 shadow-xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-festive-marigold/10 border border-festive-marigold/30 text-festive-amber mb-2">
              <span>💳</span>
              <span>Step 8 • UTR Submission</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-content-primary">
              Submit 12-Digit UTR
            </h2>
            <p className="text-xs text-content-muted mt-1 leading-relaxed">
              Order Reference:{' '}
              <span className="font-mono text-festive-marigold font-bold">
                {orderState.orderReference}
              </span>{' '}
              • Token Due:{' '}
              <span className="font-mono text-content-primary font-bold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmitUtr} className="space-y-5">
            <div>
              <label
                htmlFor="utr-input"
                className="block text-sm font-semibold text-content-primary mb-1.5"
              >
                12-Digit UPI Transaction Reference (UTR){' '}
                <span className="text-festive-crimson">*</span>
              </label>
              <input
                id="utr-input"
                type="text"
                required
                maxLength={12}
                inputMode="numeric"
                autoComplete="off"
                value={utrInput}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setUtrInput(digits);
                }}
                placeholder="e.g. 428912345678"
                className="w-full min-h-touch px-4 py-2.5 rounded-xl bg-bg-elevated border border-white/10 text-content-primary font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-festive-marigold"
              />
              <p className="text-xs text-content-muted mt-1.5">
                Exact 12 digits from your UPI payment receipt.
              </p>
              {utrError && (
                <p className="mt-1.5 text-xs text-festive-crimson flex items-center gap-1">
                  <span>⚠️</span> {utrError}
                </p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-bg-elevated border border-white/5 text-xs text-content-muted space-y-1">
              <p className="text-content-primary font-semibold">
                ℹ️ Status Notice:
              </p>
              <p>
                Submitted UTR references are recorded as unverified. This application does not verify payments or establish receipt of funds.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('QR_PAYMENT')}
                className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
              >
                ← Back to QR
              </button>
              <button
                type="submit"
                disabled={isSubmitting || utrInput.length !== 12}
                className="w-full sm:flex-1 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
              >
                <span>{isSubmitting ? 'Recording UTR...' : 'Submit UTR Reference →'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 7: QR PAYMENT INSTRUCTIONS
  // ══════════════════════════════════════════════════════════════════
  if (currentStep === 'QR_PAYMENT' && orderState) {
    const amountInr = (orderState.tokenDuePaise / 100).toFixed(2);
    const isRestricted = Boolean(paymentConfig?.isRestrictedEnv);

    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-7 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-festive-marigold/10 border border-festive-marigold/30 text-festive-amber mb-1">
              <span>📱</span>
              <span>Step 7 • Advance Token QR</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-content-primary">
              UPI QR Payment Instructions
            </h2>
            <p className="text-xs text-content-muted">
              Scan the QR code to submit your advance order token.
            </p>
          </div>

          {/* Test QR Code Fixture */}
          <TestQrCode
            vpa={paymentConfig?.vpa || 'test-fixture@nagarjunatraders'}
            accountName={paymentConfig?.accountName || 'NAGARJUNA TRADERS (TEST)'}
            amountInr={amountInr}
            transactionNote={orderState.orderReference}
            isRestricted={isRestricted}
          />

          {/* Payment Guidance Card */}
          <div className="p-4 rounded-xl bg-bg-elevated border border-white/10 text-xs space-y-2">
            <div className="flex justify-between items-center text-content-secondary">
              <span>Order Reference:</span>
              <span className="font-mono text-festive-marigold font-bold">
                {orderState.orderReference}
              </span>
            </div>
            <div className="flex justify-between items-center text-content-secondary">
              <span>Advance Token Required:</span>
              <span className="font-mono font-bold text-content-primary">
                ₹{amountInr} ({orderState.tokenDuePaise < 20000 ? 'Tier ₹50' : 'Tier ₹100'})
              </span>
            </div>
            <div className="flex justify-between items-center text-content-secondary">
              <span>Remaining Balance:</span>
              <span className="font-mono font-bold text-content-primary">
                {formatPaise(orderState.balanceDuePaise)} (Payable at collection)
              </span>
            </div>
            {isRestricted && (
              <div className="pt-2 border-t border-white/5 text-[11px] text-amber-300 leading-relaxed">
                ⚠️ Restricted Test Environment: Non-payable test QR fixture active. Real payment collection is disabled. Do not transfer actual money.
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('REVIEW')}
              className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
            >
              ← Back to Review
            </button>

            <button
              type="button"
              onClick={handleProceedToUtr}
              className="w-full sm:flex-1 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>I Have Paid / Enter 12-Digit UTR →</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 6: ORDER REVIEW (DEFAULT)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-festive-marigold/10 border border-festive-marigold/30 text-festive-amber mb-2">
          <span>📋</span>
          <span>Step 6 • Order Review</span>
        </div>
        <h2 className="text-2xl font-bold font-display text-content-primary">
          Order Review & Advance Token
        </h2>
        <p className="text-xs text-content-muted mt-0.5">
          Review your items, customer details, and advance token before proceeding.
        </p>
      </div>

      {/* Customer Verification Box */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-content-primary font-display">
            Customer Information
          </h3>
          <button
            type="button"
            onClick={onEditCustomer}
            className="text-xs text-festive-marigold hover:underline font-semibold"
          >
            Edit Details
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-content-muted block">Full Name:</span>
            <span className="font-semibold text-content-primary">
              {customer.fullName || '—'}
            </span>
          </div>
          <div>
            <span className="text-content-muted block">Mobile Number:</span>
            <span className="font-mono text-content-primary">
              {customer.mobileNumber ? `+91 ${customer.mobileNumber}` : '—'}
            </span>
          </div>
          <div>
            <span className="text-content-muted block">Collection Preference:</span>
            <span className="text-content-primary">
              {customer.fulfilmentPreference === 'SPECIAL_ENQUIRY'
                ? 'Special Enquiry'
                : 'Counter Pickup'}
            </span>
          </div>
          <div>
            <span className="text-content-muted block">Age Attestation:</span>
            <span className="text-emerald-400 font-semibold">
              {customer.ageConfirmed ? '✓ 18+ Confirmed' : 'Not confirmed'}
            </span>
          </div>
        </div>
      </div>

      {/* Item Summary List */}
      <div className="p-4 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-content-primary font-display">
            Items in Order ({totals.totalQuantity} items)
          </h3>
          <button
            type="button"
            onClick={onEditCart}
            className="text-xs text-festive-marigold hover:underline font-semibold"
          >
            Edit Cart
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.variantId}`}
              className="p-2.5 rounded-xl bg-bg-elevated border border-white/5 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-content-primary">
                  {item.productName} ({item.variantName})
                </span>
                <span className="text-content-muted block text-[11px]">
                  Qty: {item.quantity} × {item.pricePaise !== null ? formatPaise(item.pricePaise) : item.printedPriceText}
                </span>
              </div>
              <span className="font-mono font-bold text-content-primary">
                {item.lineSubtotalPaise !== null
                  ? formatPaise(item.lineSubtotalPaise)
                  : 'Unpriced'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Breakdown Card with Tiered Token Rules */}
      <div className="p-5 rounded-2xl bg-bg-surface border border-white/10 space-y-3">
        <h3 className="text-base font-bold font-display text-content-primary">
          Price & Advance Token Accounting
        </h3>

        <div className="space-y-2 text-sm border-b border-white/5 pb-3">
          <div className="flex justify-between items-center">
            <span className="text-content-muted">Order Subtotal:</span>
            <span className="font-mono font-bold text-content-primary">
              {formatPaise(totals.subtotalPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-content-muted">Advance Token Required:</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-festive-amber border border-amber-500/20">
                {totals.subtotalPaise < 20000 ? '₹50 (< ₹200)' : '₹100 (≥ ₹200)'}
              </span>
            </div>
            <span className="font-mono font-bold text-festive-amber">
              {formatPaise(totals.tokenAmountPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-content-muted">Balance Due at Collection:</span>
            <span className="font-mono font-bold text-content-primary">
              {formatPaise(totals.remainingBalancePaise)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-baseline pt-1">
          <span className="text-base font-bold text-content-primary">
            Subtotal Due Overall
          </span>
          <span className="text-2xl font-bold font-mono text-festive-marigold">
            {formatPaise(totals.subtotalPaise)}
          </span>
        </div>
      </div>

      {/* Payment Disabled Truthful Notice */}
      {paymentConfig && !isPaymentAvailable && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/30 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-300">
            <span>ℹ️</span>
            <span>Payment instructions are currently unavailable.</span>
          </div>
          <p className="text-amber-200/80 leading-relaxed">
            Public online payment collection is currently disabled. Real customer details and payments are not being accepted online. You may copy your order summary or share it via WhatsApp for order enquiry.
          </p>
        </div>
      )}

      {/* Warnings & Action Button */}
      {!canProceedToPayment && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/40 text-xs text-amber-300">
          {!totals.minOrderRequirementMet && totals.totalQuantity > 0
            ? '⚠️ Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.'
            : '⚠️ Please ensure customer details are complete (including 18+ confirmation) and items are selected before proceeding.'}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onEditCart}
          className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
        >
          ← Edit Cart
        </button>

        {isPaymentAvailable ? (
          <button
            type="button"
            disabled={!canProceedToPayment || isSubmitting}
            onClick={handleProceedToQr}
            className="w-full sm:flex-1 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
          >
            <span>{isSubmitting ? 'Creating Order...' : 'Proceed to QR Payment Instructions →'}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:flex-1 min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
            >
              {copied ? '✓ Summary Copied!' : '📋 Copy Order Summary'}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 min-h-touch px-5 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white font-semibold text-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>💬 Share to WhatsApp</span>
              </a>
            )}
          </>
        )}
      </div>

      {/* Quick Order Lookup Form */}
      <div className="pt-6 border-t border-white/5">
        <details className="text-xs text-content-muted">
          <summary className="cursor-pointer hover:text-content-primary font-semibold py-1">
            Already placed an order? Track with Order Reference & Token
          </summary>
          <form onSubmit={handleLookupOrder} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={statusLookupRef}
              onChange={(e) => setStatusLookupRef(e.target.value)}
              placeholder="Order Reference (e.g. NT-4921)"
              className="flex-1 px-3 py-2 rounded-xl bg-bg-elevated border border-white/10 font-mono text-content-primary text-xs"
            />
            <input
              type="password"
              value={statusLookupToken}
              onChange={(e) => setStatusLookupToken(e.target.value)}
              placeholder="Access Token"
              className="w-full sm:w-44 px-3 py-2 rounded-xl bg-bg-elevated border border-white/10 font-mono text-content-primary text-xs"
            />
            <button
              type="submit"
              disabled={statusPolling}
              className="px-4 py-2 rounded-xl bg-bg-surface hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-xs"
            >
              Lookup
            </button>
          </form>
          {statusLookupError && (
            <p className="mt-1 text-festive-crimson">{statusLookupError}</p>
          )}
        </details>
      </div>
    </div>
  );
};
