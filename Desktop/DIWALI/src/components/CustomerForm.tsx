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

    if (!values.ageConfirmed) {
      errs.ageConfirmed =
        'You must confirm that you are 18 years or older as required by the Explosives Rules, 2008.';
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
      ageConfirmed: true,
    });

    if (Object.keys(validationErrors).length === 0) {
      onSubmit(details);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <div className="bg-bg-surface border border-white/10 rounded-2xl p-5 md:p-7 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold font-display text-content-primary">
            Customer Information
          </h2>
          <p className="text-sm text-content-muted mt-1 leading-relaxed">
            Please enter your contact details for counter reservation. Your
            details are stored only in memory for this session and are never
            saved to local storage.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Full Name Field */}
          <div>
            <label
              htmlFor="customer-full-name"
              className="block text-sm font-semibold text-content-primary mb-1.5"
            >
              Full Name <span className="text-festive-crimson">*</span>
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
              placeholder="e.g. Ravi Kumar"
              className={`w-full min-h-touch px-4 py-2.5 rounded-xl bg-bg-elevated border text-content-primary placeholder-content-muted text-base transition-colors focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
                touched.fullName && errors.fullName
                  ? 'border-festive-crimson ring-1 ring-festive-crimson'
                  : 'border-white/10 hover:border-white/20'
              }`}
              aria-invalid={!!(touched.fullName && errors.fullName)}
              aria-describedby={
                touched.fullName && errors.fullName ? 'name-error' : undefined
              }
            />
            {touched.fullName && errors.fullName && (
              <p
                id="name-error"
                className="mt-1.5 text-xs text-festive-crimson flex items-center gap-1"
              >
                <span aria-hidden="true">⚠️</span> {errors.fullName}
              </p>
            )}
          </div>

          {/* Mobile Number Field */}
          <div>
            <label
              htmlFor="customer-mobile"
              className="block text-sm font-semibold text-content-primary mb-1.5"
            >
              10-Digit Mobile Number{' '}
              <span className="text-festive-crimson">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-mono text-content-muted select-none">
                +91
              </span>
              <input
                id="customer-mobile"
                type="tel"
                required
                maxLength={10}
                inputMode="numeric"
                autoComplete="tel-national"
                value={details.mobileNumber}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setDetails((prev) => ({ ...prev, mobileNumber: cleaned }));
                }}
                onBlur={() => handleBlur('mobileNumber')}
                placeholder="9876543210"
                className={`w-full min-h-touch pl-14 pr-4 py-2.5 rounded-xl bg-bg-elevated border text-content-primary font-mono placeholder-content-muted text-base transition-colors focus:outline-none focus:ring-2 focus:ring-festive-marigold ${
                  touched.mobileNumber && errors.mobileNumber
                    ? 'border-festive-crimson ring-1 ring-festive-crimson'
                    : 'border-white/10 hover:border-white/20'
                }`}
                aria-invalid={!!(touched.mobileNumber && errors.mobileNumber)}
                aria-describedby={
                  touched.mobileNumber && errors.mobileNumber
                    ? 'mobile-error'
                    : undefined
                }
              />
            </div>
            {touched.mobileNumber && errors.mobileNumber ? (
              <p
                id="mobile-error"
                className="mt-1.5 text-xs text-festive-crimson flex items-center gap-1"
              >
                <span aria-hidden="true">⚠️</span> {errors.mobileNumber}
              </p>
            ) : (
              <p className="mt-1 text-xs text-content-muted">
                Required to verify your booking at the counter.
              </p>
            )}
          </div>

          {/* Fulfilment Preference */}
          <div>
            <label className="block text-sm font-semibold text-content-primary mb-1.5">
              Collection Method
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
                className={`min-h-touch p-3 rounded-xl border text-left text-xs transition-colors ${
                  details.fulfilmentPreference === 'COUNTER_PICKUP'
                    ? 'bg-festive-marigold/15 border-festive-marigold text-content-primary font-semibold'
                    : 'bg-bg-elevated border-white/10 text-content-muted hover:border-white/20'
                }`}
              >
                <div className="font-bold text-sm">Store Counter Pickup</div>
                <div className="text-content-muted mt-0.5">
                  Collect at licensed premises in Sivakasi
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
                className={`min-h-touch p-3 rounded-xl border text-left text-xs transition-colors ${
                  details.fulfilmentPreference === 'SPECIAL_ENQUIRY'
                    ? 'bg-festive-marigold/15 border-festive-marigold text-content-primary font-semibold'
                    : 'bg-bg-elevated border-white/10 text-content-muted hover:border-white/20'
                }`}
              >
                <div className="font-bold text-sm">Wholesale Enquiry</div>
                <div className="text-content-muted mt-0.5">
                  Large festival batch or dealer inquiry
                </div>
              </button>
            </div>
          </div>

          {/* Age Attestation Checkbox */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3 rounded-xl bg-bg-elevated border border-white/5 cursor-pointer hover:border-white/10">
              <input
                type="checkbox"
                required
                checked={details.ageConfirmed}
                onChange={(e) =>
                  setDetails((prev) => ({
                    ...prev,
                    ageConfirmed: e.target.checked,
                  }))
                }
                onBlur={() => handleBlur('ageConfirmed')}
                className="w-5 h-5 mt-0.5 rounded text-festive-marigold focus:ring-festive-marigold border-white/20 bg-bg-base"
              />
              <span className="text-xs text-content-secondary leading-relaxed">
                I confirm that I am{' '}
                <strong className="text-content-primary">
                  18 years of age or older
                </strong>{' '}
                as mandated by the Indian Explosives Rules, 2008 for fireworks
                purchase. <span className="text-festive-crimson">*</span>
              </span>
            </label>
            {touched.ageConfirmed && errors.ageConfirmed && (
              <p className="mt-1.5 text-xs text-festive-crimson flex items-center gap-1">
                <span aria-hidden="true">⚠️</span> {errors.ageConfirmed}
              </p>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label
              htmlFor="customer-notes"
              className="block text-sm font-semibold text-content-primary mb-1.5"
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
              placeholder="e.g. Expected pickup date or packaging requests."
              className="w-full p-3 rounded-xl bg-bg-elevated border border-white/10 text-content-primary placeholder-content-muted text-sm focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            />
            <div className="text-right text-[11px] text-content-muted mt-1">
              {details.notes.length}/150 characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            {onBackToCatalogue && (
              <button
                type="button"
                onClick={onBackToCatalogue}
                className="w-full sm:w-auto min-h-touch px-5 py-2.5 rounded-xl bg-bg-elevated hover:bg-white/10 border border-white/10 text-content-primary font-semibold text-sm transition-colors text-center"
              >
                ← Back to Catalogue
              </button>
            )}
            <button
              type="submit"
              className="w-full sm:flex-1 min-h-touch px-6 py-3 rounded-xl bg-festive-marigold hover:bg-festive-marigold-hover active:scale-95 text-black font-semibold text-base transition-transform flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-festive-marigold"
            >
              <span>Save & Continue to Review →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
