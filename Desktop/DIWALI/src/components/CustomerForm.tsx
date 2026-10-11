import React, { useState } from 'react';
import { CustomerDetails, FormErrors } from '../types/customer';

interface CustomerFormProps {
  initialValues: CustomerDetails;
  onSubmit: (details: CustomerDetails) => void;
  onBackToCatalogue?: () => void;
}

export const CustomerForm: React.FC<CustomerFormProps> = ({
  initialValues,
  onSubmit,
  onBackToCatalogue,
}) => {
  const [details, setDetails] = useState<CustomerDetails>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validate = (values: CustomerDetails): FormErrors => {
    const errs: FormErrors = {};

    if (!values.fullName.trim() || values.fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters).';
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(values.mobileNumber.trim())) {
      errs.mobileNumber =
        'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    }

    return errs;
  };

  const handleBlur = (field: keyof CustomerDetails) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(details));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(details);
    setErrors(validationErrors);
    setTouched({
      fullName: true,
      mobileNumber: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(details);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="bg-white border border-stone-200 rounded-3xl p-6 md:p-8 shadow-warm-md">
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 mb-2">
            <span>👤</span>
            <span>Counter Collection Verification</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-stone-900">
            Customer Information
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 leading-relaxed">
            Please enter your contact details for counter pickup reservation and order reference tracking.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="customer-full-name"
              className="block text-sm font-semibold text-stone-800 mb-1.5"
            >
              Full Name <span className="text-festive-vermilion">*</span>
            </label>
            <input
              id="customer-full-name"
              type="text"
              required
              autoComplete="name"
              value={details.fullName}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, fullName: e.target.value }))
              }
              onBlur={() => handleBlur('fullName')}
              placeholder="e.g. Kalyan Varma"
              className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-stone-50 border text-stone-900 placeholder-stone-400 text-sm sm:text-base transition-colors focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white ${
                touched.fullName && errors.fullName
                  ? 'border-festive-vermilion ring-1 ring-festive-vermilion'
                  : 'border-stone-300 hover:border-stone-400'
              }`}
            />
            {touched.fullName && errors.fullName && (
              <p className="mt-1.5 text-xs text-festive-vermilion flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {errors.fullName}
              </p>
            )}
          </div>

          {/* 10-Digit Mobile Number */}
          <div>
            <label
              htmlFor="customer-mobile-number"
              className="block text-sm font-semibold text-stone-800 mb-1.5"
            >
              10-Digit Mobile Number <span className="text-festive-vermilion">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 text-sm font-semibold select-none">
                +91
              </span>
              <input
                id="customer-mobile-number"
                type="tel"
                required
                autoComplete="tel"
                inputMode="numeric"
                maxLength={10}
                value={details.mobileNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setDetails((prev) => ({ ...prev, mobileNumber: cleaned }));
                }}
                onBlur={() => handleBlur('mobileNumber')}
                placeholder="9848022338"
                className={`w-full min-h-[48px] pl-14 pr-4 py-2.5 rounded-xl bg-stone-50 border text-stone-900 placeholder-stone-400 text-sm sm:text-base font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white ${
                  touched.mobileNumber && errors.mobileNumber
                    ? 'border-festive-vermilion ring-1 ring-festive-vermilion'
                    : 'border-stone-300 hover:border-stone-400'
                }`}
              />
            </div>
            {touched.mobileNumber && errors.mobileNumber && (
              <p className="mt-1.5 text-xs text-festive-vermilion flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {errors.mobileNumber}
              </p>
            )}
            <p className="text-[11px] text-stone-500 mt-1">
              Required for pickup confirmation SMS and order reference identification.
            </p>
          </div>

          {/* Fulfilment Preference */}
          <div>
            <label className="block text-sm font-semibold text-stone-800 mb-1.5">
              Pickup & Collection Preference
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() =>
                  setDetails((prev) => ({
                    ...prev,
                    fulfilmentPreference: 'COUNTER_PICKUP',
                  }))
                }
                className={`min-h-[48px] p-3 rounded-xl border text-left text-xs transition-colors ${
                  details.fulfilmentPreference === 'COUNTER_PICKUP'
                    ? 'bg-amber-50 border-festive-marigold text-stone-900 font-semibold shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-sm text-stone-900">Store Counter Pickup</div>
                <div className="text-stone-500 mt-0.5">
                  Direct pickup at Sivakasi counter
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  setDetails((prev) => ({
                    ...prev,
                    fulfilmentPreference: 'SPECIAL_ENQUIRY',
                  }))
                }
                className={`min-h-[48px] p-3 rounded-xl border text-left text-xs transition-colors ${
                  details.fulfilmentPreference === 'SPECIAL_ENQUIRY'
                    ? 'bg-amber-50 border-festive-marigold text-stone-900 font-semibold shadow-sm'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                <div className="font-bold text-sm text-stone-900">Wholesale Enquiry</div>
                <div className="text-stone-500 mt-0.5">
                  Order reservation for festival groups
                </div>
              </button>
            </div>
          </div>



          {/* Optional Notes */}
          <div>
            <label
              htmlFor="customer-notes"
              className="block text-sm font-semibold text-stone-800 mb-1.5"
            >
              Special Instructions / Notes (Optional)
            </label>
            <textarea
              id="customer-notes"
              rows={2}
              maxLength={150}
              value={details.notes}
              onChange={(e) =>
                setDetails((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="e.g. Expected pickup date or packaging preferences."
              className="w-full p-3 rounded-xl bg-stone-50 border border-stone-300 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-festive-marigold focus:bg-white"
            />
            <div className="text-right text-[11px] text-stone-400 mt-1">
              {details.notes.length}/150 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            {onBackToCatalogue && (
              <button
                type="button"
                onClick={onBackToCatalogue}
                className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 font-semibold text-sm transition-colors text-center"
              >
                ← Back to Catalogue
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:flex-1 min-h-[48px] px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-white font-bold text-base transition-transform flex items-center justify-center gap-2 shadow-md focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>Save & Continue to Review →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
