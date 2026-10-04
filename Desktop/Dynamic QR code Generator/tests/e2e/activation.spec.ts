/// <reference lib="dom" />
import { test, expect } from '@playwright/test';

test.describe('QRoute Merchant Activation Flow E2E', () => {
  const ACTIVE_ID = 'ACTV7K2M9Q4X8P6V';
  const DISABLED_ID = 'DACT7K2M9Q4X8P6V';
  const RETIRED_ID = 'RETR7K2M9Q4X8P6V';
  const UNACTIVATED_ID = 'PEND5C8R2W7K9M4Q';
  const UNACTIVATED_TURNSTILE_ID = 'TRNS7K2M9Q4X8P6V';
  const UNACTIVATED_RESET_ID = 'TRNS5C8R2W7K9M4Q';
  const VALID_CODE = 'K7XM-92PR-V8Q2';
  const VALID_REVIEW_URL =
    'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4';

  test('1. Full merchant activation journey and subsequent 302 redirect', async ({
    page,
    request,
  }) => {
    // 1. Open activation page for unactivated card
    await page.goto(`/activate/${UNACTIVATED_ID}`);

    // Wait for readiness check to complete and form to be visible (allow up to 15s for worker dev server cold boot)
    const form = page.getByTestId('activation-form');
    await expect(form).toBeVisible({ timeout: 15000 });

    // Verify card context
    await expect(page.getByText(`ID: ${UNACTIVATED_ID}`)).toBeVisible();

    // Fill in activation details
    await page.fill('#businessName', 'Sunrise Bakery & Cafe');
    await page.fill('#reviewUrl', VALID_REVIEW_URL);

    // Enter activation code in lowercase to verify auto-formatting and normalization
    const codeInput = page.locator('#activationCode');
    await codeInput.fill('k7xm92prv8q2');
    await expect(codeInput).toHaveValue('K7XM-92PR-V8Q2');

    // Submit form
    const submitBtn = page.getByRole('button', { name: /Activate Review Card/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Verify success state
    const successCard = page.getByTestId('activation-success');
    await expect(successCard).toBeVisible();
    await expect(page.getByText(/Your Review Card is Live!/i)).toBeVisible();
    await expect(page.getByText('Sunrise Bakery & Cafe')).toBeVisible();

    // Verify redirect endpoint /c/:publicId now returns 302 Found to destination
    const redirectRes = await request.get(`/c/${UNACTIVATED_ID}`, {
      maxRedirects: 0,
    });

    expect(redirectRes.status()).toBe(302);
    expect(redirectRes.headers()['location']).toBe(VALID_REVIEW_URL);
    expect(redirectRes.headers()['cache-control']).toBe(
      'private, no-cache, no-store, must-revalidate'
    );
    expect(redirectRes.headers()['referrer-policy']).toBe('no-referrer');
  });

  test('2. Already-active card displays in-service status page without leaking secrets', async ({
    page,
  }) => {
    await page.goto(`/activate/${ACTIVE_ID}`);

    const activeCard = page.getByTestId('card-already-active');
    await expect(activeCard).toBeVisible();
    await expect(page.getByText(/Card Already Active/i)).toBeVisible();
    await expect(page.getByText(/In Service/i)).toBeVisible();

    // Ensure form is not present
    await expect(page.getByTestId('activation-form')).not.toBeVisible();
  });

  test('3. Disabled and retired cards display appropriate status screens', async ({ page }) => {
    // Disabled card
    await page.goto(`/activate/${DISABLED_ID}`);
    const disabledCard = page.getByTestId('card-disabled');
    await expect(disabledCard).toBeVisible();
    await expect(page.getByText(/Card Disabled/i)).toBeVisible();

    // Retired card
    await page.goto(`/activate/${RETIRED_ID}`);
    const retiredCard = page.getByTestId('card-retired');
    await expect(retiredCard).toBeVisible();
    await expect(page.getByText(/Card Retired/i)).toBeVisible();
  });

  test('4. Form validates invalid Google review links client-side before submission', async ({
    page,
  }) => {
    await page.goto('/activate');

    const form = page.getByTestId('activation-form');
    await expect(form).toBeVisible();

    // Fill invalid URL
    await page.fill('#businessName', 'Test Cafe');
    await page.fill('#reviewUrl', 'https://attacker.com/fake-google');
    await page.fill('#activationCode', VALID_CODE);

    const submitBtn = page.getByRole('button', { name: /Activate Review Card/i });
    await submitBtn.click();

    // Field error should be visible
    await expect(
      page.getByText(/Destination must be an approved Google Review domain/i)
    ).toBeVisible();
  });

  test('5. Mobile layout and accessibility checks', async ({ page }) => {
    // Set mobile viewport (iPhone 13 standard)
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(`/activate/${ACTIVE_ID}`);
    const activeCard = page.getByTestId('card-already-active');
    await expect(activeCard).toBeVisible();

    // Verify touch button has minimum touch target
    const button = page.getByRole('button', { name: /Test Live Redirect/i });
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44); // WCAG 2.1 touch target guideline
    }
  });

  test('6. Turnstile client challenge flow (widget render, token capture, submit validation, expiration)', async ({
    page,
  }) => {
    // Inject Turnstile test environment and mock window.turnstile
    await page.addInitScript(() => {
      (window as unknown as { __TURNSTILE_TEST_SITE_KEY__: string }).__TURNSTILE_TEST_SITE_KEY__ =
        '0x4AAAAAAATestKey';

      let callbacks: {
        callback?: (token: string) => void;
        'error-callback'?: (err: unknown) => void;
        'expired-callback'?: () => void;
      } = {};
      let resetCount = 0;

      (
        window as unknown as {
          __turnstileMock: {
            solve: (t: string) => void;
            expire: () => void;
            error: () => void;
            getResetCount: () => number;
          };
        }
      ).__turnstileMock = {
        solve: (token: string) => callbacks.callback?.(token),
        expire: () => callbacks['expired-callback']?.(),
        error: () => callbacks['error-callback']?.('challenge_error'),
        getResetCount: () => resetCount,
      };

      (
        window as unknown as {
          turnstile: {
            render: (c: HTMLElement, opts: unknown) => string;
            reset: () => void;
            remove: () => void;
          };
        }
      ).turnstile = {
        render: (container: HTMLElement, opts: unknown) => {
          callbacks = opts as typeof callbacks;
          const widget = document.createElement('div');
          widget.setAttribute('data-testid', 'mock-turnstile-element');
          widget.textContent = 'Cloudflare Turnstile Verified';
          container.appendChild(widget);
          return 'mock-widget-id-1';
        },
        reset: () => {
          resetCount++;
        },
        remove: () => {},
      };
    });

    await page.goto(`/activate/${UNACTIVATED_TURNSTILE_ID}`);

    // Wait for form to appear
    const form = page.getByTestId('activation-form');
    await expect(form).toBeVisible({ timeout: 15000 });

    // Verify Turnstile widget container is rendered
    await expect(page.getByTestId('turnstile-widget')).toBeVisible();
    await expect(page.getByTestId('mock-turnstile-element')).toBeVisible();

    // Fill valid form details
    await page.fill('#businessName', 'Sunrise Cafe');
    await page.fill('#reviewUrl', VALID_REVIEW_URL);
    await page.fill('#activationCode', VALID_CODE);

    // Verify submit button is disabled before challenge completion
    const submitBtn = page.getByRole('button', { name: /Activate Review Card/i });
    await expect(submitBtn).toBeDisabled();

    // Simulate successful challenge resolution
    await page.evaluate(() => {
      (
        window as unknown as { __turnstileMock: { solve: (t: string) => void } }
      ).__turnstileMock.solve('test-valid-turnstile-token');
    });

    // Verify submit button becomes enabled after challenge solved
    await expect(submitBtn).toBeEnabled();

    // Simulate token expiration
    await page.evaluate(() => {
      (window as unknown as { __turnstileMock: { expire: () => void } }).__turnstileMock.expire();
    });

    // Verify submit button becomes disabled again upon token expiry
    await expect(submitBtn).toBeDisabled();

    // Re-solve challenge
    await page.evaluate(() => {
      (
        window as unknown as { __turnstileMock: { solve: (t: string) => void } }
      ).__turnstileMock.solve('test-fresh-turnstile-token');
    });
    await expect(submitBtn).toBeEnabled();

    // Intercept network call to verify turnstileToken reaches POST /api/public/activate
    let interceptedToken: string | undefined;
    await page.route('/api/public/activate', async (route) => {
      const postData = route.request().postDataJSON();
      interceptedToken = postData.turnstileToken;
      await route.continue();
    });

    await submitBtn.click();

    // Confirm the token was transmitted
    expect(interceptedToken).toBe('test-fresh-turnstile-token');
  });

  test('7. Turnstile error callback displays user message and failure resets widget', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      (window as unknown as { __TURNSTILE_TEST_SITE_KEY__: string }).__TURNSTILE_TEST_SITE_KEY__ =
        '0x4AAAAAAATestKey';

      let callbacks: {
        callback?: (token: string) => void;
        'error-callback'?: (err: unknown) => void;
      } = {};
      let resetCount = 0;

      (
        window as unknown as {
          __turnstileMock: {
            solve: (t: string) => void;
            error: () => void;
            getResetCount: () => number;
          };
        }
      ).__turnstileMock = {
        solve: (token: string) => callbacks.callback?.(token),
        error: () => callbacks['error-callback']?.('network_error'),
        getResetCount: () => resetCount,
      };

      (
        window as unknown as {
          turnstile: {
            render: (c: HTMLElement, opts: unknown) => string;
            reset: () => void;
            remove: () => void;
          };
        }
      ).turnstile = {
        render: (container: HTMLElement, opts: unknown) => {
          callbacks = opts as typeof callbacks;
          return 'mock-widget-id-2';
        },
        reset: () => {
          resetCount++;
        },
        remove: () => {},
      };
    });

    await page.goto(`/activate/${UNACTIVATED_RESET_ID}`);
    await expect(page.getByTestId('activation-form')).toBeVisible({ timeout: 15000 });

    // Trigger challenge error
    await page.evaluate(() => {
      (window as unknown as { __turnstileMock: { error: () => void } }).__turnstileMock.error();
    });

    // Check error message displayed
    await expect(page.getByText(/Security verification failed. Please try again./i)).toBeVisible();

    // Solve and submit invalid activation code to verify reset is triggered
    await page.evaluate(() => {
      (
        window as unknown as { __turnstileMock: { solve: (t: string) => void } }
      ).__turnstileMock.solve('token-for-failed-request');
    });

    await page.fill('#businessName', 'Sunrise Cafe');
    await page.fill('#reviewUrl', VALID_REVIEW_URL);
    await page.fill('#activationCode', 'WRNG-TEST-1234');

    const submitBtn = page.getByRole('button', { name: /Activate Review Card/i });
    await expect(submitBtn).toBeEnabled();

    // Mock API 400 error response
    await page.route('/api/public/activate', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: { code: 'INVALID_CODE', message: 'Invalid activation code' },
        }),
      });
    });

    await submitBtn.click();

    // Error banner should be visible
    await expect(page.getByTestId('error-banner')).toBeVisible();

    // Verify widget was reset
    const resetCalls = await page.evaluate(() => {
      return (
        window as unknown as { __turnstileMock: { getResetCount: () => number } }
      ).__turnstileMock.getResetCount();
    });
    expect(resetCalls).toBeGreaterThan(0);
  });
});
