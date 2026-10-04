import React, { useState, useEffect, useRef } from 'react';
import { PageContainer } from '../components/ui/PageContainer';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Turnstile, type TurnstileRef } from '../components/ui/Turnstile';
import { validatePublicId } from '../shared/utils';
import { formatActivationCode, validateActivationCodeFormat } from '../shared/activation-crypto';
import { validateGoogleReviewUrl } from '../shared/google-url-validator';
import type {
  ApiResponse,
  ActivationResponseData,
  CardPublicStatusData,
  CardStatus,
  ActivationRequest,
} from '../shared/types';

interface ActivationPageProps {
  initialPublicId?: string;
  turnstileSiteKey?: string;
}

export const ActivationPage: React.FC<ActivationPageProps> = ({
  initialPublicId = '',
  turnstileSiteKey,
}) => {
  const isDetected = Boolean(initialPublicId);
  const [publicId, setPublicId] = useState<string>(initialPublicId.toUpperCase());
  const [cardStatus, setCardStatus] = useState<CardStatus | 'NOT_FOUND' | 'INVALID_ID' | null>(
    null
  );
  const [initialLoading, setInitialLoading] = useState<boolean>(Boolean(initialPublicId));

  // Sync state if initialPublicId prop changes
  useEffect(() => {
    if (initialPublicId) {
      setPublicId(initialPublicId.toUpperCase());
    }
  }, [initialPublicId]);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.endsWith('.local'));
  const isProductionDomain = typeof window !== 'undefined' && !isLocalhost;

  // Determine Turnstile configuration and environment
  const testSiteKey =
    typeof window !== 'undefined'
      ? (window as unknown as { __TURNSTILE_TEST_SITE_KEY__?: string }).__TURNSTILE_TEST_SITE_KEY__
      : undefined;
  const siteKey =
    turnstileSiteKey ??
    testSiteKey ??
    (isProductionDomain
      ? import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAFNSTzU9erQakQC-'
      : undefined);
  const isTurnstileRequired = isProductionDomain || Boolean(turnstileSiteKey || testSiteKey);

  // Turnstile state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileRef>(null);

  // Form states
  const [businessName, setBusinessName] = useState<string>('');
  const [reviewUrl, setReviewUrl] = useState<string>('');
  const [activationCode, setActivationCode] = useState<string>('');

  // UI state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<ActivationResponseData | null>(null);

  // Field validation states
  const [fieldErrors, setFieldErrors] = useState<{
    publicId?: string;
    businessName?: string;
    reviewUrl?: string;
    activationCode?: string;
  }>({});

  // Check card status on mount or when publicId changes
  useEffect(() => {
    if (!publicId) {
      setCardStatus(null);
      setInitialLoading(false);
      return;
    }

    const val = validatePublicId(publicId);
    if (!val.isValid || !val.normalizedId) {
      if (isDetected) {
        setCardStatus('INVALID_ID');
      } else {
        setCardStatus(null);
      }
      if (isDetected) setInitialLoading(false);
      return;
    }

    let isMounted = true;
    if (isDetected) {
      setInitialLoading(true);
    }
    setErrorMessage(null);

    fetch(`/api/public/card/${val.normalizedId}/status`)
      .then(async (res) => {
        if (!isMounted) return;
        if (res.status === 404 || !res.ok) {
          if (isDetected) {
            setCardStatus('NOT_FOUND');
          } else {
            setFieldErrors((prev) => ({
              ...prev,
              publicId: 'Card not found. Please check your identifier.',
            }));
          }
          return;
        }
        const data: ApiResponse<CardPublicStatusData> = await res.json();
        if (data.success) {
          if (isDetected || data.data.status !== 'UNACTIVATED') {
            setCardStatus(data.data.status);
          }
        } else {
          if (isDetected) {
            setCardStatus('NOT_FOUND');
          } else {
            setFieldErrors((prev) => ({
              ...prev,
              publicId: 'Card not found. Please check your identifier.',
            }));
          }
        }
      })
      .catch(() => {
        if (isMounted)
          setErrorMessage('Unable to connect to the network. Please check your connection.');
      })
      .finally(() => {
        if (isMounted && isDetected) setInitialLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [publicId, isDetected]);

  // Handle formatted activation code input
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^0-9a-hj-km-np-tv-z]/gi, '').toUpperCase();
    if (clean.length <= 12) {
      setActivationCode(formatActivationCode(clean));
      if (fieldErrors.activationCode) {
        setFieldErrors((prev) => ({ ...prev, activationCode: undefined }));
      }
    }
  };

  // Form submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors: {
      publicId?: string;
      businessName?: string;
      reviewUrl?: string;
      activationCode?: string;
    } = {};

    // Validate Card Identifier (if entered manually)
    const targetPublicId = isDetected
      ? initialPublicId.toUpperCase()
      : publicId.trim().toUpperCase();

    if (!isDetected) {
      if (!targetPublicId) {
        errors.publicId = 'Please enter a valid 16-character card identifier';
      } else {
        const idValidation = validatePublicId(targetPublicId);
        if (!idValidation.isValid) {
          errors.publicId =
            idValidation.error ?? 'Please enter a valid 16-character card identifier';
        }
      }
    }

    // Validate Business Name
    const cleanName = businessName.replace(/[<>]/g, '').trim();
    if (cleanName.length < 2) {
      errors.businessName = 'Business name must be at least 2 characters long';
    } else if (cleanName.length > 100) {
      errors.businessName = 'Business name cannot exceed 100 characters';
    }

    // Validate Review URL
    const urlValidation = validateGoogleReviewUrl(reviewUrl);
    if (!urlValidation.isValid) {
      errors.reviewUrl =
        urlValidation.error ?? 'Please enter a valid Google Review destination URL';
    }

    // Validate Activation Code
    const codeValidation = validateActivationCodeFormat(activationCode);
    if (!codeValidation.isValid) {
      errors.activationCode = codeValidation.error ?? 'Please enter a 12-character activation code';
    }

    // Validate Turnstile Bot Defense if required
    if (isTurnstileRequired) {
      if (!siteKey) {
        setErrorMessage(
          'Security verification is not configured for this domain. Card activation is temporarily unavailable.'
        );
        return;
      }
      if (!turnstileToken) {
        setErrorMessage('Please complete the security challenge before activating your card.');
        return;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSubmitting(true);

    try {
      const payload: ActivationRequest = {
        publicId: targetPublicId,
        businessName: cleanName,
        reviewUrl: urlValidation.normalizedUrl ?? reviewUrl.trim(),
        activationCode: codeValidation.normalizedCode ?? activationCode.trim(),
        ...(turnstileToken ? { turnstileToken } : {}),
      };

      const response = await fetch('/api/public/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result: ApiResponse<ActivationResponseData> = await response.json();

      if (response.ok && result.success) {
        setSuccessData(result.data);
        setCardStatus('ACTIVE');
      } else {
        const errorText =
          !result.success && result.error.message
            ? result.error.message
            : 'Activation failed. Please check your code and link and try again.';
        setErrorMessage(errorText);
        // Reset single-use Turnstile challenge on failure
        if (isTurnstileRequired && turnstileRef.current) {
          turnstileRef.current.reset();
        }
        setTurnstileToken(null);
      }
    } catch {
      setErrorMessage('Network error occurred during activation. Please try again.');
      if (isTurnstileRequired && turnstileRef.current) {
        turnstileRef.current.reset();
      }
      setTurnstileToken(null);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <PageContainer size="narrow">
        {/* Loading Initial Status */}
        {initialLoading ? (
          <Card className="border-zinc-200 shadow-xs">
            <CardContent className="py-12 text-center space-y-3">
              <div
                className="animate-spin inline-block h-8 w-8 border-3 border-zinc-950 border-t-transparent rounded-full"
                role="status"
                aria-label="Loading"
              />
              <p className="text-sm font-medium text-zinc-600">Checking card readiness...</p>
            </CardContent>
          </Card>
        ) : successData ? (
          /* SUCCESS STATE */
          <Card className="border-emerald-200 shadow-sm bg-white" data-testid="activation-success">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-2">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <Badge variant="active" className="mx-auto">
                Link Active
              </Badge>
              <CardTitle className="text-2xl pt-2 text-zinc-950">Link Saved Successfully</CardTitle>
              <CardDescription>
                Your card is now connected to Google. Customers who tap or scan will be directed
                straight to your official Google review page.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center pb-1 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">Business</span>
                  <span className="font-semibold text-zinc-900">{successData.businessName}</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium">QR ID</span>
                  <span
                    className="font-mono text-zinc-900 font-semibold"
                    data-testid="qr-id-display"
                  >
                    {successData.publicId}
                  </span>
                </div>
                <div className="flex justify-between items-start pb-1 border-b border-zinc-200">
                  <span className="text-zinc-500 font-medium whitespace-nowrap mr-2">
                    Destination
                  </span>
                  <span
                    className="font-mono text-xs text-zinc-700 max-w-[240px] truncate text-right"
                    title={successData.destinationUrl}
                    data-testid="destination-url-display"
                  >
                    {successData.destinationUrl}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-medium">Status</span>
                  <span className="font-semibold text-emerald-700">ACTIVE</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`/c/${successData.publicId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button variant="primary" size="md" className="w-full">
                    Continue to Google &rarr;
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        ) : cardStatus === 'ACTIVE' ? (
          /* ALREADY ACTIVE STATE */
          <Card className="border-zinc-200 shadow-xs" data-testid="card-already-active">
            <CardHeader className="text-center">
              <Badge variant="active" className="mx-auto">
                In Service
              </Badge>
              <CardTitle className="text-2xl pt-2">Card Already Active</CardTitle>
              <CardDescription>
                This card has already been activated and is redirecting customers. For security,
                activated cards cannot be re-registered through the public portal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center">
                <span className="text-xs uppercase font-medium text-zinc-500 tracking-wider">
                  Card ID
                </span>
                <p className="text-lg font-mono font-bold text-zinc-900 mt-0.5">{publicId}</p>
              </div>
              <a href={`/c/${publicId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="primary" size="md" className="w-full">
                  Test Live Redirect &rarr;
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : cardStatus === 'DISABLED' ? (
          /* DISABLED STATE */
          <Card className="border-red-200 shadow-xs" data-testid="card-disabled">
            <CardHeader className="text-center">
              <Badge variant="disabled" className="mx-auto">
                Temporarily Inactive
              </Badge>
              <CardTitle className="text-2xl pt-2">Card Disabled</CardTitle>
              <CardDescription>
                This card has been temporarily deactivated by an administrator and cannot be
                activated.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : cardStatus === 'RETIRED' ? (
          /* RETIRED STATE */
          <Card className="border-zinc-300 shadow-xs" data-testid="card-retired">
            <CardHeader className="text-center">
              <Badge variant="neutral" className="mx-auto">
                Permanently Retired
              </Badge>
              <CardTitle className="text-2xl pt-2">Card Retired</CardTitle>
              <CardDescription>
                This card has been permanently decommissioned and can no longer be used.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : cardStatus === 'NOT_FOUND' || cardStatus === 'INVALID_ID' ? (
          /* NOT FOUND STATE */
          <Card className="border-zinc-200 shadow-xs" data-testid="card-not-found">
            <CardHeader className="text-center">
              <Badge variant="neutral" className="mx-auto">
                Not Found
              </Badge>
              <CardTitle className="text-2xl pt-2">Card Not Recognized</CardTitle>
              <CardDescription>
                We could not find an official review card with identifier{' '}
                <span className="font-mono font-semibold text-zinc-900">{publicId || '—'}</span>.
                Please ensure you scanned an official card.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-center">
              <a
                href="/activate"
                onClick={(e) => {
                  e.preventDefault();
                  window.history.pushState({}, '', '/activate');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
              >
                <Button variant="outline" size="md">
                  Enter Card Identifier Manually &rarr;
                </Button>
              </a>
            </CardContent>
          </Card>
        ) : (
          /* ACTIVATION FORM STATE */
          <Card className="border-zinc-200 shadow-xs" data-testid="activation-form">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Card Activation
                </span>
                {publicId && (
                  <Badge variant="unactivated" data-testid="card-id-badge">
                    ID: {publicId}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl pt-2">Set Up Your Link</CardTitle>
              <CardDescription>
                Connect your Google review link to your card. Once saved, customers who tap or scan
                will be taken directly to your official Google review page.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {errorMessage && (
                <div
                  className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-800"
                  role="alert"
                  data-testid="error-banner"
                >
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                {/* Card Identifier: Auto-detected (read-only) vs Manual fallback */}
                {isDetected ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="publicId" className="block text-sm font-medium text-zinc-900">
                        Card Identifier
                      </label>
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"
                        data-testid="detected-badge"
                      >
                        <svg
                          className="h-3 w-3 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Detected from Card
                      </span>
                    </div>
                    <div className="relative">
                      <Input
                        id="publicId"
                        name="publicId"
                        type="text"
                        value={publicId}
                        readOnly
                        aria-readonly="true"
                        className="font-mono tracking-wider bg-zinc-100 text-zinc-700 cursor-not-allowed border-zinc-200 pr-10 select-all"
                        data-testid="detected-card-id"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-zinc-400">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Automatically detected from your physical card scan. Cannot be modified.
                    </p>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="publicId"
                      className="block text-sm font-medium text-zinc-900 mb-1"
                    >
                      Card Identifier
                    </label>
                    <Input
                      id="publicId"
                      name="publicId"
                      type="text"
                      placeholder="e.g. TRNS7K2M9Q4X8P6V"
                      value={publicId}
                      onChange={(e) => {
                        setPublicId(e.target.value.toUpperCase().trim());
                        if (fieldErrors.publicId) {
                          setFieldErrors((prev) => ({ ...prev, publicId: undefined }));
                        }
                      }}
                      error={fieldErrors.publicId}
                      maxLength={16}
                      autoCapitalize="characters"
                      className="font-mono tracking-wider"
                      required
                      data-testid="manual-card-id"
                    />
                    <p className="mt-1 text-xs text-zinc-500">
                      Enter the 16-character identifier from your card setup link, or scan your card
                      to detect it automatically.
                    </p>
                  </div>
                )}

                {/* Business Name */}
                <div>
                  <label
                    htmlFor="businessName"
                    className="block text-sm font-medium text-zinc-900 mb-1"
                  >
                    Business Name
                  </label>
                  <Input
                    id="businessName"
                    name="businessName"
                    type="text"
                    placeholder="e.g. Sunrise Bakery"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (fieldErrors.businessName) {
                        setFieldErrors((prev) => ({ ...prev, businessName: undefined }));
                      }
                    }}
                    error={fieldErrors.businessName}
                    maxLength={100}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    The name of your business as displayed to customers.
                  </p>
                </div>

                {/* Google Review Destination Link */}
                <div>
                  <label
                    htmlFor="reviewUrl"
                    className="block text-sm font-medium text-zinc-900 mb-1"
                  >
                    Google Review URL
                  </label>
                  <Input
                    id="reviewUrl"
                    name="reviewUrl"
                    type="url"
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    value={reviewUrl}
                    onChange={(e) => {
                      setReviewUrl(e.target.value);
                      if (fieldErrors.reviewUrl) {
                        setFieldErrors((prev) => ({ ...prev, reviewUrl: undefined }));
                      }
                    }}
                    error={fieldErrors.reviewUrl}
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Supports official Google Review links (e.g. search.google.com, g.page, or
                    maps.app.goo.gl).
                  </p>
                </div>

                {/* Activation Security Code */}
                <div>
                  <label
                    htmlFor="activationCode"
                    className="block text-sm font-medium text-zinc-900 mb-1"
                  >
                    Activation Password / Activation Code
                  </label>
                  <Input
                    id="activationCode"
                    name="activationCode"
                    type="text"
                    placeholder="XXXX-XXXX-XXXX"
                    value={activationCode}
                    onChange={handleCodeChange}
                    error={fieldErrors.activationCode}
                    maxLength={14}
                    className="font-mono tracking-wider text-center text-lg"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck="false"
                    required
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    12-character security code supplied on your card welcome insert.
                  </p>
                </div>

                {/* Cloudflare Turnstile Bot Defense */}
                {isTurnstileRequired && (
                  <div className="pt-2">
                    {siteKey ? (
                      <div className="space-y-1">
                        <Turnstile
                          ref={turnstileRef}
                          siteKey={siteKey}
                          onSuccess={(token) => {
                            setTurnstileToken(token);
                            setTurnstileError(null);
                          }}
                          onExpire={() => {
                            setTurnstileToken(null);
                          }}
                          onError={() => {
                            setTurnstileToken(null);
                            setTurnstileError('Security verification failed. Please try again.');
                          }}
                        />
                        {turnstileError && (
                          <p className="text-xs text-red-600 text-center font-medium">
                            {turnstileError}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 text-center font-medium"
                        role="alert"
                      >
                        Security verification challenge is required but not configured for this
                        domain.
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full"
                    isLoading={submitting}
                    disabled={submitting || (isTurnstileRequired && (!siteKey || !turnstileToken))}
                  >
                    Activate Review Card &rarr;
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <footer className="mt-8 text-center text-xs text-zinc-400">
          QRoute Platform &bull; Permanent Edge Dynamic Review Routing
        </footer>
      </PageContainer>
    </main>
  );
};
