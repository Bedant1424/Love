import React, { useState, useEffect } from 'react';
import { DemoOrderRecordWithItems, PaymentConfig } from '../server/types';
import { apiClient } from '../services/apiClient';
import { formatPaise } from '../utils/formatters';

interface TrackOrderViewProps {
  initialOrderReference?: string;
  onNavigateToCatalogue: () => void;
}

export const TrackOrderView: React.FC<TrackOrderViewProps> = ({
  initialOrderReference,
  onNavigateToCatalogue,
}) => {
  // Pre-fill from props, URL or localStorage
  const [orderReference, setOrderReference] = useState<string>(() => {
    if (initialOrderReference) return initialOrderReference;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const trackParam = urlParams.get('track');
      if (trackParam) return trackParam;
      return localStorage.getItem('nt_tracked_order_ref') || '';
    }
    return '';
  });

  const [mobileNumber, setMobileNumber] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('nt_tracked_order_mobile') || '';
    }
    return '';
  });

  const [currentOrder, setCurrentOrder] = useState<DemoOrderRecordWithItems | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // OTP Recovery Mode
  const [isOtpMode, setIsOtpMode] = useState<boolean>(false);
  const [otpStep, setOtpStep] = useState<'REQUEST' | 'VERIFY'>('REQUEST');
  const [otpMobile, setOtpMobile] = useState<string>('');
  const [otpCode, setOtpCode] = useState<string>('');
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [retrievedOrders, setRetrievedOrders] = useState<DemoOrderRecordWithItems[]>([]);

  // Direct UTR submission for UNPAID orders
  const [utrInput, setUtrInput] = useState<string>('');
  const [utrSubmitting, setUtrSubmitting] = useState<boolean>(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [utrSuccess, setUtrSuccess] = useState<string | null>(null);

  // Payment Config for QR
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);

  useEffect(() => {
    apiClient
      .getPaymentConfig()
      .then(setPaymentConfig)
      .catch(() => {
        setPaymentConfig(null);
      });
  }, []);

  // Automatic lookup on load if order reference & mobile are available
  useEffect(() => {
    const storedRef = orderReference.trim();
    const storedMob = mobileNumber.trim();
    if (storedRef && storedMob && /^[6-9]\d{9}$/.test(storedMob)) {
      handleLookup(storedRef, storedMob);
    }
  }, []);

  const handleLookup = async (refToLookup?: string, mobToLookup?: string) => {
    const ref = (refToLookup || orderReference).trim();
    const mob = (mobToLookup || mobileNumber).trim();

    if (!ref) {
      setError('Please enter your Order Reference (e.g., NT-3905).');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(mob)) {
      setError('Please enter your registered 10-digit mobile number.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const order = await apiClient.trackOrder(ref, mob);
      setCurrentOrder(order);

      // Persist in localStorage and URL for refresh resilience
      if (typeof window !== 'undefined') {
        localStorage.setItem('nt_tracked_order_ref', order.order_reference);
        localStorage.setItem('nt_tracked_order_mobile', mob);
        if (order.access_token) {
          localStorage.setItem('nt_tracked_order_token', order.access_token);
        }
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set('track', order.order_reference);
        window.history.replaceState({}, '', newUrl.toString());
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to locate order. Please check your reference and phone number.');
      setCurrentOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const mob = otpMobile.trim();
    if (!/^[6-9]\d{9}$/.test(mob)) {
      setOtpError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    setOtpError(null);
    try {
      const res = await apiClient.requestTrackingOtp(mob);
      setOtpStep('VERIFY');
      setOtpMessage(
        res.devOtp
          ? `Code generated! For restricted preview testing, use code: ${res.devOtp}`
          : 'A 6-digit verification code has been generated. Please enter it below.'
      );
    } catch (err: any) {
      setOtpError(err?.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const mob = otpMobile.trim();
    const code = otpCode.trim();

    if (!/^\d{6}$/.test(code)) {
      setOtpError('Verification code must be exactly 6 numeric digits.');
      return;
    }

    setLoading(true);
    setOtpError(null);
    try {
      const res = await apiClient.verifyTrackingOtp(mob, code);
      if (res.orders && res.orders.length > 0) {
        setRetrievedOrders(res.orders);
        setOtpMessage(`Found ${res.orders.length} order(s) for your mobile number.`);
      } else {
        setOtpError('No orders were found associated with this mobile number.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRetrievedOrder = (order: DemoOrderRecordWithItems) => {
    setCurrentOrder(order);
    setOrderReference(order.order_reference);
    setMobileNumber(otpMobile);
    setIsOtpMode(false);

    if (typeof window !== 'undefined') {
      localStorage.setItem('nt_tracked_order_ref', order.order_reference);
      localStorage.setItem('nt_tracked_order_mobile', otpMobile);
      if (order.access_token) {
        localStorage.setItem('nt_tracked_order_token', order.access_token);
      }
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('track', order.order_reference);
      window.history.replaceState({}, '', newUrl.toString());
    }
  };

  const handleDirectUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrder) return;
    const utr = utrInput.trim();
    if (!/^\d{12}$/.test(utr)) {
      setUtrError('UTR must be exactly 12 numeric digits.');
      return;
    }

    setUtrSubmitting(true);
    setUtrError(null);
    setUtrSuccess(null);
    try {
      const updated = await apiClient.submitUtr(
        currentOrder.order_reference,
        utr,
        currentOrder.access_token
      );
      setUtrSuccess('12-digit UTR recorded successfully. Status updated to awaiting manual verification.');
      setCurrentOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_reference: updated.paymentReference,
              payment_status: updated.paymentStatus,
              payment_submitted_at: new Date().toISOString(),
            }
          : null
      );
    } catch (err: any) {
      setUtrError(err?.message || 'Failed to record UTR.');
    } finally {
      setUtrSubmitting(false);
    }
  };

  const handleDownloadQr = async () => {
    const url = paymentConfig?.qrImageUrl || '/images/nagarjuna-payment-qr.jpeg';
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'Nagarjuna-Traders-Payment-QR.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Nagarjuna-Traders-Payment-QR.jpg';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Status timeline steps
  const statusSteps = [
    { key: 'SUBMITTED', label: '1. Submitted', icon: '📝' },
    { key: 'CONFIRMED', label: '2. Confirmed', icon: '✅' },
    { key: 'PREPARING', label: '3. Preparing', icon: '📦' },
    { key: 'READY_FOR_PICKUP', label: '4. Ready for Pickup', icon: '🎉' },
    { key: 'COMPLETED', label: '5. Completed', icon: '🤝' },
  ];

  const operationalOrder = ['SUBMITTED', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'];
  const currentStatusIndex = currentOrder
    ? operationalOrder.indexOf(currentOrder.operational_status)
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800">
          <span>🔍</span>
          <span>Live Order Tracking</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-900">
          Track Your Diwali Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
          View your order preparation timeline, advance token state, and pickup instructions in real time.
        </p>
      </div>

      {/* Lookup Card */}
      {!currentOrder && !isOtpMode && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            className="space-y-4"
          >
            <div>
              <label htmlFor="track-ref" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Order Reference (e.g. NT-3905)
              </label>
              <input
                id="track-ref"
                type="text"
                required
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value.toUpperCase())}
                placeholder="NT-XXXX"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-sm font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white uppercase"
              />
            </div>

            <div>
              <label htmlFor="track-mob" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                Registered 10-Digit Mobile Number
              </label>
              <input
                id="track-mob"
                type="tel"
                required
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                <strong>Lookup Failed:</strong>
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-white font-bold text-sm sm:text-base transition-transform flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <span>{loading ? 'Locating Order...' : 'Track Order Status →'}</span>
            </button>
          </form>

          <div className="pt-4 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOtpMode(true);
                setOtpMobile(mobileNumber);
                setOtpError(null);
                setOtpMessage(null);
              }}
              className="text-xs font-semibold text-festive-marigold hover:text-orange-700 underline underline-offset-4 cursor-pointer"
            >
              Don't know your order reference? Retrieve via mobile &amp; OTP
            </button>
          </div>
        </div>
      )}

      {/* OTP Retrieval Flow */}
      {!currentOrder && isOtpMode && (
        <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-lg font-bold font-display text-stone-900">
                Retrieve Lost Order Reference
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                We'll verify your mobile number with a secure 6-digit code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOtpMode(false)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 underline"
            >
              ← Back to Reference Lookup
            </button>
          </div>

          {otpMessage && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              {otpMessage}
            </div>
          )}

          {otpError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {otpError}
            </div>
          )}

          {otpStep === 'REQUEST' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label htmlFor="otp-mob" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Your 10-Digit Mobile Number
                </label>
                <input
                  id="otp-mob"
                  type="tel"
                  required
                  maxLength={10}
                  value={otpMobile}
                  onChange={(e) => setOtpMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-white font-bold text-sm transition-transform flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer"
              >
                <span>{loading ? 'Sending Code...' : 'Send 6-Digit Code →'}</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp-code" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  id="otp-code"
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-stone-50 font-mono text-base font-bold tracking-widest text-stone-900 focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white text-center"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setOtpStep('REQUEST')}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50"
                >
                  Change Mobile
                </button>
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 disabled:opacity-50 text-white font-bold text-sm transition-transform flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{loading ? 'Verifying...' : 'Verify Code & Retrieve Orders →'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Retrieved Orders List */}
          {retrievedOrders.length > 0 && (
            <div className="mt-6 pt-4 border-t border-stone-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
                Your Found Orders
              </h3>
              <div className="space-y-2">
                {retrievedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-amber-50/50 hover:border-festive-marigold transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-stone-900 text-sm block">
                        {ord.order_reference}
                      </span>
                      <span className="text-stone-500 text-[11px]">
                        {new Date(ord.created_at).toLocaleDateString('en-IN', {
                          dateStyle: 'medium',
                        })}{' '}
                        • Status: <strong className="text-stone-800">{ord.operational_status}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-stone-900">
                        {formatPaise(ord.subtotal_paise)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectRetrievedOrder(ord)}
                        className="px-3 py-1.5 rounded-lg bg-festive-marigold text-white font-bold text-xs hover:bg-festive-marigold-hover shadow-xs cursor-pointer"
                      >
                        View Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active Tracked Order View */}
      {currentOrder && (
        <div className="space-y-6">
          {/* Order Header Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
              <div>
                <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block font-mono">
                  Order Reference
                </span>
                <span className="text-2xl font-bold font-mono text-festive-marigold">
                  {currentOrder.order_reference}
                </span>
                <span className="text-xs text-stone-500 block mt-0.5">
                  Placed on {new Date(currentOrder.created_at).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleLookup(currentOrder.order_reference, currentOrder.customer_mobile);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>↻ Refresh Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentOrder(null);
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('track');
                    window.history.replaceState({}, '', newUrl.toString());
                  }}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 text-xs font-medium cursor-pointer"
                >
                  Track Another
                </button>
              </div>
            </div>

            {/* Customer & Fulfilment Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block text-[11px]">Customer Name</span>
                <span className="font-semibold text-stone-900">{currentOrder.customer_name}</span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block text-[11px]">Mobile Number</span>
                <span className="font-mono font-semibold text-stone-900">
                  +91 {currentOrder.customer_mobile}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-100">
                <span className="text-stone-500 block text-[11px]">Fulfilment</span>
                <span className="font-semibold text-stone-900">
                  {currentOrder.fulfilment_preference === 'SPECIAL_ENQUIRY' ||
                  currentOrder.fulfilment_preference === 'HOSTEL_PICKUP'
                    ? 'Hostel / Special Pickup'
                    : 'Campus Counter Pickup'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-4">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-stone-800">
              Order Fulfillment Timeline
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {statusSteps.map((step, idx) => {
                const isPastOrCurrent = currentStatusIndex >= idx;
                const isCurrent = currentOrder.operational_status === step.key;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      isCurrent
                        ? 'bg-amber-50 border-festive-marigold text-festive-marigold font-bold shadow-xs ring-2 ring-amber-400/20'
                        : isPastOrCurrent
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800 font-medium'
                        : 'bg-stone-50 border-stone-200 text-stone-400'
                    }`}
                  >
                    <div className="text-lg mb-1">{step.icon}</div>
                    <div className="text-xs font-mono">{step.label}</div>
                    {isCurrent && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-festive-marigold text-white">
                        Current
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment & Advance Token Card */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-stone-800">
                Advance Token &amp; Payment Status
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-mono ${
                  currentOrder.payment_status === 'RECORDED_UNVERIFIED'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : currentOrder.payment_status === 'VERIFIED_TOKEN' || currentOrder.payment_status === 'RECONCILED'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {currentOrder.payment_status === 'RECORDED_UNVERIFIED'
                  ? 'Awaiting Manual Verification'
                  : currentOrder.payment_status === 'VERIFIED_TOKEN' || currentOrder.payment_status === 'RECONCILED'
                  ? 'Token Payment Confirmed'
                  : 'Advance Token Unpaid'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                  Advance Token Required
                </span>
                <span className="text-lg font-bold font-mono text-festive-marigold">
                  {formatPaise(currentOrder.token_amount_paise)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                  Remaining Balance (Pickup)
                </span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {formatPaise(currentOrder.remaining_balance_paise)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <span className="text-[11px] text-stone-500 uppercase tracking-wider block">
                  Total Order Amount
                </span>
                <span className="text-lg font-bold font-mono text-stone-900">
                  {formatPaise(currentOrder.subtotal_paise)}
                </span>
              </div>
            </div>

            {/* State A: UNPAID -> Display QR and UTR submission */}
            {currentOrder.payment_status === 'UNPAID' && (
              <div className="mt-4 p-5 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Box with Download */}
                  <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col items-center gap-2 max-w-[200px] shrink-0">
                    <img
                      src={paymentConfig?.qrImageUrl || '/images/nagarjuna-payment-qr.jpeg'}
                      alt="Nagarjuna Traders Official UPI QR"
                      className="w-36 h-auto object-contain rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={handleDownloadQr}
                      className="w-full py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 rounded border border-amber-200 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>↓ Download QR</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <h3 className="text-sm font-bold text-stone-900 font-display">
                      Scan QR to Pay Advance Token
                    </h3>
                    <p className="text-stone-600">
                      Merchant UPI ID:{' '}
                      <strong className="font-mono text-festive-marigold select-all">
                        {paymentConfig?.vpa || 'jena2005@slc'}
                      </strong>{' '}
                      ({paymentConfig?.accountName || 'Mr Subham Jena'})
                    </p>
                    <p className="text-stone-600">
                      Exact Token Due:{' '}
                      <strong className="font-mono text-stone-900">
                        {formatPaise(currentOrder.token_amount_paise)}
                      </strong>
                    </p>

                    <form onSubmit={handleDirectUtrSubmit} className="pt-2 space-y-2">
                      <label htmlFor="track-utr" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                        Enter 12-Digit Bank UTR / UPI Reference:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="track-utr"
                          type="text"
                          required
                          maxLength={12}
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value.replace(/\D/g, ''))}
                          placeholder="12-digit UTR"
                          className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:ring-1 focus:ring-festive-marigold focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={utrSubmitting || utrInput.length !== 12}
                          className="px-4 py-2 rounded-xl bg-festive-marigold text-white font-bold text-xs hover:bg-festive-marigold-hover disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {utrSubmitting ? 'Submitting...' : 'Submit UTR'}
                        </button>
                      </div>
                      {utrError && <p className="text-xs text-rose-600 font-medium">{utrError}</p>}
                      {utrSuccess && <p className="text-xs text-emerald-700 font-medium">{utrSuccess}</p>}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* State B: RECORDED_UNVERIFIED -> Display Submitted UTR and Awaiting Notice */}
            {currentOrder.payment_status === 'RECORDED_UNVERIFIED' && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-stone-700 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-amber-600 font-bold">ℹ️</span>
                  <span className="font-semibold text-stone-900">Payment Reference Submitted</span>
                </div>
                <p>
                  12-Digit UTR:{' '}
                  <strong className="font-mono text-festive-marigold select-all">
                    {currentOrder.payment_reference || 'Submitted'}
                  </strong>{' '}
                  {currentOrder.payment_submitted_at && (
                    <span className="text-stone-500 font-mono text-[11px]">
                      (Submitted on {new Date(currentOrder.payment_submitted_at).toLocaleString('en-IN')})
                    </span>
                  )}
                </p>
                <p className="text-stone-600">
                  Your payment reference is recorded and is awaiting manual verification by store staff during order preparation and counter pickup. You do not need to pay the token again.
                </p>
              </div>
            )}

            {/* State C: CONFIRMED / PAID */}
            {(currentOrder.payment_status === 'VERIFIED_TOKEN' || currentOrder.payment_status === 'RECONCILED') && (
              <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <span>✓</span>
                  <span>Advance Token Confirmed</span>
                </div>
                <p className="text-emerald-800">
                  Your advance token payment has been confirmed. The remaining balance of{' '}
                  <strong className="font-mono">{formatPaise(currentOrder.remaining_balance_paise)}</strong>{' '}
                  will be collected during pickup.
                </p>
              </div>
            )}
          </div>

          {/* Itemized Order Summary */}
          <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-warm-md space-y-4">
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-stone-800">
              Ordered Items ({currentOrder.items.length})
            </h2>

            <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden text-xs">
              {currentOrder.items.map((it) => (
                <div key={it.id} className="p-3.5 flex items-center justify-between gap-4 bg-white">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm font-display">
                      {it.product_name_snapshot || 'Firework Item'}
                    </h3>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      {it.variant_name_snapshot || 'Standard Option'}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-stone-600">
                      {it.quantity} × {formatPaise(it.unit_price_paise)}
                    </p>
                    <p className="font-bold text-stone-900 text-sm">
                      {formatPaise(it.line_subtotal_paise)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-between items-center text-xs font-mono">
              <span className="text-stone-500 uppercase tracking-wider">Subtotal:</span>
              <span className="text-base font-bold text-stone-900">
                {formatPaise(currentOrder.subtotal_paise)}
              </span>
            </div>
          </div>

          {/* Pickup Instructions */}
          <div className="p-5 rounded-2xl bg-[#FAF6EE] border border-stone-200 text-xs text-stone-600 space-y-2">
            <h3 className="text-sm font-bold text-stone-900 font-display">
              Pickup Instructions
            </h3>
            <p>
              • Please present your order reference <strong className="text-stone-900 font-mono">{currentOrder.order_reference}</strong> and registered mobile number <strong className="text-stone-900 font-mono">+91 {currentOrder.customer_mobile}</strong> at the counter.
            </p>
            <p>
              • Remaining balance of <strong className="text-stone-900 font-mono">{formatPaise(currentOrder.remaining_balance_paise)}</strong> is payable upon pickup via cash or UPI.
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={onNavigateToCatalogue}
              className="px-6 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
            >
              ← Continue Shopping Catalogue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
