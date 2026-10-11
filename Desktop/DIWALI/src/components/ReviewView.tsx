import React, { useState, useRef, useEffect } from 'react';
import { CartItem, CartTotals, PaymentStatus } from '../types/cart';
import { CustomerDetails } from '../types/customer';
import { formatPaise } from '../utils/formatters';
import { generateEnquiryText, getWhatsAppUrl } from '../utils/enquirySummary';
import { apiClient } from '../services/apiClient';
import { PaymentConfig, PaymentIssueType } from '../server/types';
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

  // Payment Issue Reporting State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueType, setIssueType] = useState<PaymentIssueType>('QR_NOT_SCANNING');
  const [issueDescription, setIssueDescription] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueResult, setIssueResult] = useState<{
    reference: string;
    message: string;
  } | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);

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
    /^[6-9]\d{9}$/.test(customer.mobileNumber.trim());

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

  // Payment Issue Submission
  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setIssueSubmitting(true);
    setIssueError(null);

    try {
      const res = await apiClient.reportPaymentIssue({
        orderReference: orderState?.orderReference,
        customerName: customer.fullName || 'Customer',
        customerMobile: customer.mobileNumber || '9999999999',
        issueType,
        description: issueDescription.trim() || undefined,
      });

      setIssueResult({
        reference: res.issueReference,
        message: res.message,
      });
    } catch (err: any) {
      setIssueError(err.message || 'Failed to submit payment issue report.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // PAYMENT SUPPORT ISSUE MODAL
  // ══════════════════════════════════════════════════════════════════
  const renderPaymentIssueModal = () => {
    if (!showIssueModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-warm-lg space-y-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-festive-marigold font-bold text-lg">
                ?
              </div>
              <div>
                <h3 className="text-xl font-bold font-display text-stone-900">
                  Payment Support Assistance
                </h3>
                <p className="text-xs text-stone-500">
                  Report a problem with UPI QR scanning, app payment, or UTR entry
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowIssueModal(false)}
              className="text-stone-400 hover:text-stone-700 p-1.5 -m-1.5 rounded-lg text-lg leading-none"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          {issueResult ? (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <span>✓</span>
                <span>Issue Report Logged</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed">
                {issueResult.message}
              </p>
              <div className="p-3 rounded-xl bg-white border border-amber-200/80 font-mono text-xs flex justify-between items-center">
                <span className="text-stone-500">Support Reference:</span>
                <span className="font-bold text-festive-marigold text-sm">
                  {issueResult.reference}
                </span>
              </div>
              <p className="text-[11px] text-stone-500">
                Our store staff will review this ticket during your order verification. You can proceed with your order reference.
              </p>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleReportIssue} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Issue Type <span className="text-festive-vermilion">*</span>
                </label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value as PaymentIssueType)}
                  className="w-full min-h-[44px] px-3.5 py-2 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                >
                  <option value="QR_NOT_SCANNING">QR code not scanning in camera/app</option>
                  <option value="QR_LIMIT_REACHED">Daily UPI bank transaction limit reached</option>
                  <option value="APP_CANNOT_OPEN">UPI payment app cannot open / crashes</option>
                  <option value="PAYMENT_APP_ERROR">Bank server declined or timed out</option>
                  <option value="UTR_SUBMISSION_FAILED">UTR not generated or receipt missing</option>
                  <option value="OTHER">Other enquiry or manual assistance needed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Details / Description (Optional)
                </label>
                <textarea
                  rows={3}
                  maxLength={200}
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Describe what occurred in your payment app or bank..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 text-xs placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
                />
                <div className="text-right text-[11px] text-stone-400 mt-1">
                  {issueDescription.length}/200 characters
                </div>
              </div>

              {issueError && (
                <p className="text-xs text-festive-vermilion">{issueError}</p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issueSubmitting}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover text-white text-xs font-bold shadow-md shadow-orange-500/20 disabled:opacity-50"
                >
                  {issueSubmitting ? 'Submitting...' : 'Submit Support Ticket →'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 10: ORDER STATUS TRACKER
  // ══════════════════════════════════════════════════════════════════
  if (currentStep === 'ORDER_STATUS' && orderState) {
    const isUnverified = orderState.paymentStatus === 'RECORDED_UNVERIFIED';

    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between border-b border-stone-200 pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display text-stone-900">
              Order Status Tracker
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Status for Reference: <span className="font-mono text-festive-marigold font-bold">{orderState.orderReference}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshStatus}
            disabled={statusPolling}
            className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-white hover:bg-stone-50 border border-stone-300 text-xs font-semibold text-stone-800 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>{statusPolling ? 'Refreshing...' : '🔄 Refresh Status'}</span>
          </button>
        </div>

        {/* Operational Status Stepper */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-4">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
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
                      ? 'bg-amber-50 border-festive-marigold text-festive-marigold font-bold shadow-sm'
                      : isPastOrCurrent
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                      : 'bg-stone-50 border-stone-200 text-stone-400'
                  }`}
                >
                  <div className="text-xs font-mono">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Token Status Card */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-3">
          <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-mono">
            Advance Token & Payment State
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200">
              <span className="text-[11px] text-stone-500 block">Advance Token</span>
              <span className="text-base font-bold font-mono text-festive-marigold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block">Remaining Balance</span>
              <span className="text-base font-bold font-mono text-stone-900">
                {formatPaise(orderState.balanceDuePaise)}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-[11px] text-stone-500 block">Payment State</span>
              <span
                className={`text-xs font-bold font-mono px-2 py-0.5 rounded inline-block mt-1 ${
                  isUnverified
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : orderState.paymentStatus === 'UNPAID'
                    ? 'bg-stone-200 text-stone-700 border border-stone-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {isUnverified ? 'RECORDED (UNVERIFIED)' : orderState.paymentStatus}
              </span>
            </div>
          </div>

          {orderState.paymentReference && (
            <div className="mt-3 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
              <div>
                <strong>Submitted 12-Digit UTR:</strong>{' '}
                <span className="font-mono text-festive-marigold font-bold">
                  {orderState.paymentReference}
                </span>
              </div>
              <div className="text-[11px] text-stone-500">
                Note: This reference is recorded as unverified. This application does not verify payments or establish receipt of funds.
              </div>
            </div>
          )}
        </div>

        {/* Pickup Information */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-2 text-xs text-stone-600">
          <h3 className="text-sm font-bold text-stone-900 font-display">
            Order Pickup Information
          </h3>
          <p>
            • Present your order reference <strong className="text-stone-900 font-mono">{orderState.orderReference}</strong> and registered mobile number upon pickup.
          </p>
          <p>
            • Remaining balance of <strong className="text-stone-900 font-mono">{formatPaise(orderState.balanceDuePaise)}</strong> is due upon pickup.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => setCurrentStep('REVIEW')}
            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
          >
            ← Back to Order Summary
          </button>
          {onResetOrder && (
            <button
              type="button"
              onClick={onResetOrder}
              className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-600 hover:text-stone-900 font-semibold text-sm transition-colors text-center"
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
        <div className="p-6 md:p-8 rounded-3xl bg-white border border-emerald-300 text-center space-y-4 shadow-warm-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-3xl text-emerald-700">
            ✓
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <span>🎉</span>
              <span>Order Details Recorded</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-stone-900">
              Order Reference: {orderState.orderReference}
            </h2>
            <p className="text-xs text-stone-500 mt-1 font-mono">
              Order Date: {new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })}
            </p>
          </div>

          {/* Payment & UTR Status Callout */}
          <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#FAF6EE] border border-stone-200 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
              <span className="text-stone-500">Customer Name:</span>
              <span className="font-semibold text-stone-900">{customer.fullName}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
              <span className="text-stone-500">Mobile Number:</span>
              <span className="font-mono text-stone-900">+91 {customer.mobileNumber}</span>
            </div>
            {orderState.paymentReference && (
              <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
                <span className="text-stone-500">Submitted 12-Digit UTR:</span>
                <span className="font-mono text-festive-marigold font-bold">
                  {orderState.paymentReference}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
              <span className="text-stone-500">Payment Reference Status:</span>
              <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono font-bold text-[11px] border border-amber-300">
                RECORDED_UNVERIFIED
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-stone-200/60">
              <span className="text-stone-500">Advance Token:</span>
              <span className="font-mono font-bold text-festive-marigold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 text-sm">
              <span className="font-bold text-stone-900">Balance Due upon Pickup:</span>
              <span className="font-mono font-bold text-stone-900 text-base">
                {formatPaise(orderState.balanceDuePaise)}
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
            Your 12-digit UTR has been recorded as unverified. This application does not verify payments or confirm receipt of funds. Please retain your order reference.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('ORDER_STATUS')}
              className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-sm transition-transform shadow-lg shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>Track Live Order Status →</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
            >
              {copied ? '✓ Summary Copied!' : '📋 Copy Order Summary'}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
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
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-warm-md">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 mb-2">
              <span>💳</span>
              <span>Step 8 • UTR Submission</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-stone-900">
              Submit 12-Digit UTR
            </h2>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              Order Reference:{' '}
              <span className="font-mono text-festive-marigold font-bold">
                {orderState.orderReference}
              </span>{' '}
              • Token Due:{' '}
              <span className="font-mono text-stone-900 font-bold">
                {formatPaise(orderState.tokenDuePaise)}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmitUtr} className="space-y-5">
            <div>
              <label
                htmlFor="utr-input"
                className="block text-sm font-semibold text-stone-800 mb-1.5"
              >
                12-Digit UPI Transaction Reference (UTR){' '}
                <span className="text-festive-vermilion">*</span>
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
                className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white"
              />
              <p className="text-xs text-stone-500 mt-1.5">
                Exact 12 digits from your UPI payment receipt.
              </p>
              {utrError && (
                <p className="mt-1.5 text-xs text-festive-vermilion flex items-center gap-1">
                  <span>⚠️</span> {utrError}
                </p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-stone-600 space-y-1">
              <p className="text-stone-900 font-semibold">
                ℹ️ Status Notice:
              </p>
              <p>
                Submitted UTR references are recorded as unverified. This application does not verify payments or establish receipt of funds.
              </p>
            </div>

            {/* Support Link */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  setIssueResult(null);
                  setIssueError(null);
                  setShowIssueModal(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-festive-marigold hover:text-orange-700 underline underline-offset-4 focus:outline-none"
              >
                <span>Facing an issue with UTR submission or payment? Click for assistance</span>
              </button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep('QR_PAYMENT')}
                className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
              >
                ← Back to QR
              </button>
              <button
                type="submit"
                disabled={isSubmitting || utrInput.length !== 12}
                className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
              >
                <span>{isSubmitting ? 'Recording UTR...' : 'Submit UTR Reference →'}</span>
              </button>
            </div>
          </form>
        </div>

        {renderPaymentIssueModal()}
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
        <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-warm-md space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 mb-1">
              <span>📱</span>
              <span>Step 7 • Advance Token QR</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-stone-900">
              UPI QR Payment Instructions
            </h2>
            <p className="text-xs text-stone-500">
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
          <div className="p-4 rounded-2xl bg-[#FAF6EE] border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between items-center text-stone-600">
              <span>Order Reference:</span>
              <span className="font-mono text-festive-marigold font-bold">
                {orderState.orderReference}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Advance Token Required:</span>
              <span className="font-mono font-bold text-stone-900">
                ₹{amountInr} ({orderState.tokenDuePaise < 20000 ? 'Tier ₹50' : 'Tier ₹100'})
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Remaining Balance:</span>
              <span className="font-mono font-bold text-stone-900">
                {formatPaise(orderState.balanceDuePaise)} (Payable upon pickup)
              </span>
            </div>
            {isRestricted && (
              <div className="pt-2 border-t border-stone-200 text-[11px] text-amber-800 leading-relaxed">
                ⚠️ Restricted Test Environment: Non-payable test QR fixture active. Real payment collection is disabled. Do not transfer actual money.
              </div>
            )}
          </div>

          {/* Support Link */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={() => {
                setIssueResult(null);
                setIssueError(null);
                setShowIssueModal(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-festive-marigold hover:text-orange-700 underline underline-offset-4 focus:outline-none"
            >
              <span>Facing an issue with scanning or payment? Click for assistance</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('REVIEW')}
              className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
            >
              ← Back to Review
            </button>

            <button
              type="button"
              onClick={handleProceedToUtr}
              className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>I Have Paid / Enter 12-Digit UTR →</span>
            </button>
          </div>
        </div>

        {renderPaymentIssueModal()}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // SCREEN 6: ORDER REVIEW (DEFAULT)
  // ══════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="border-b border-stone-200 pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 mb-2">
          <span>📋</span>
          <span>Step 6 • Order Review</span>
        </div>
        <h2 className="text-2xl font-bold font-display text-stone-900">
          Order Review & Advance Token
        </h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Review your items, customer details, and advance token before proceeding.
        </p>
      </div>

      {/* Customer Verification Box */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-display">
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
            <span className="text-stone-500 block">Full Name:</span>
            <span className="font-semibold text-stone-900">
              {customer.fullName || '-'}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Mobile Number:</span>
            <span className="font-mono text-stone-900">
              {customer.mobileNumber ? `+91 ${customer.mobileNumber}` : '-'}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block">Pickup Preference:</span>
            <span className="text-stone-900 font-medium">
              {customer.fulfilmentPreference === 'HOSTEL_PICKUP'
                ? 'Hostel Pickup'
                : 'Campus Pickup'}
            </span>
          </div>
        </div>
      </div>

      {/* Item Summary List */}
      <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-stone-900 font-display">
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
              className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs"
            >
              <div>
                <span className="font-semibold text-stone-900">
                  {item.productName} ({item.variantName})
                </span>
                <span className="text-stone-500 block text-[11px]">
                  Qty: {item.quantity} × {item.pricePaise !== null ? formatPaise(item.pricePaise) : item.printedPriceText}
                </span>
              </div>
              <span className="font-mono font-bold text-stone-900">
                {item.lineSubtotalPaise !== null
                  ? formatPaise(item.lineSubtotalPaise)
                  : 'Unpriced'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Financial Breakdown Card with Tiered Token Rules */}
      <div className="p-6 rounded-2xl bg-white border border-stone-200 shadow-warm-sm space-y-3">
        <h3 className="text-base font-bold font-display text-stone-900">
          Price & Advance Token Accounting
        </h3>

        <div className="space-y-2 text-sm border-b border-stone-200 pb-3">
          <div className="flex justify-between items-center">
            <span className="text-stone-500">Order Subtotal:</span>
            <span className="font-mono font-bold text-stone-900">
              {formatPaise(totals.subtotalPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <span className="text-stone-500">Advance Token Required:</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 font-semibold">
                {totals.subtotalPaise < 20000 ? '₹50 (< ₹200)' : '₹100 (≥ ₹200)'}
              </span>
            </div>
            <span className="font-mono font-bold text-festive-marigold">
              {formatPaise(totals.tokenAmountPaise)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-stone-500">Balance Due upon Pickup:</span>
            <span className="font-mono font-bold text-stone-900">
              {formatPaise(totals.remainingBalancePaise)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-baseline pt-1">
          <span className="text-base font-bold text-stone-900">
            Subtotal Due Overall
          </span>
          <span className="text-2xl font-bold font-mono text-festive-marigold">
            {formatPaise(totals.subtotalPaise)}
          </span>
        </div>
      </div>

      {/* Payment Disabled Truthful Notice */}
      {paymentConfig && !isPaymentAvailable && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
            <span>ℹ️</span>
            <span>Payment instructions are currently unavailable.</span>
          </div>
          <p className="text-amber-800 leading-relaxed">
            Public online payment collection is currently disabled. Real customer details and payments are not being accepted online. You may copy your order summary or share it via WhatsApp for order enquiry.
          </p>
        </div>
      )}

      {/* Warnings & Action Button */}
      {!canProceedToPayment && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          {!totals.minOrderRequirementMet && totals.totalQuantity > 0
            ? '⚠️ Order subtotal must be at least ₹50.00 because the required advance token is ₹50.00.'
            : '⚠️ Please ensure customer details are complete and items are selected before proceeding.'}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={onEditCart}
          className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
        >
          ← Edit Cart
        </button>

        {isPaymentAvailable ? (
          <button
            type="button"
            disabled={!canProceedToPayment || isSubmitting}
            onClick={handleProceedToQr}
            className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
          >
            <span>{isSubmitting ? 'Creating Order...' : 'Proceed to QR Payment Instructions →'}</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
            >
              {copied ? '✓ Summary Copied!' : '📋 Copy Order Summary'}
            </button>

            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:flex-1 min-h-[48px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors text-center inline-flex items-center justify-center gap-1.5"
              >
                <span>💬 Share to WhatsApp</span>
              </a>
            )}
          </>
        )}
      </div>

      {/* Quick Order Lookup Form */}
      <div className="pt-6 border-t border-stone-200">
        <details className="text-xs text-stone-500">
          <summary className="cursor-pointer hover:text-stone-900 font-semibold py-1">
            Already placed an order? Track with Order Reference & Token
          </summary>
          <form onSubmit={handleLookupOrder} className="mt-3 flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={statusLookupRef}
              onChange={(e) => setStatusLookupRef(e.target.value)}
              placeholder="Order Reference (e.g. NT-4921)"
              className="flex-1 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-stone-900 text-xs focus:bg-white"
            />
            <input
              type="password"
              value={statusLookupToken}
              onChange={(e) => setStatusLookupToken(e.target.value)}
              placeholder="Access Token"
              className="w-full sm:w-44 px-3 py-2 rounded-xl bg-stone-50 border border-stone-300 font-mono text-stone-900 text-xs focus:bg-white"
            />
            <button
              type="submit"
              disabled={statusPolling}
              className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-xs"
            >
              Lookup
            </button>
          </form>
          {statusLookupError && (
            <p className="mt-1 text-festive-vermilion">{statusLookupError}</p>
          )}
        </details>
      </div>

      {renderPaymentIssueModal()}
    </div>
  );
};
