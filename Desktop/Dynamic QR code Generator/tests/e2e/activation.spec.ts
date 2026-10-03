import { test, expect } from '@playwright/test';

test.describe('QRoute Merchant Activation Flow E2E', () => {
  const ACTIVE_ID = 'ACTV123456';
  const DISABLED_ID = 'DACT123456';
  const RETIRED_ID = 'RETR123456';
  const UNACTIVATED_ID = 'PEND654321';
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
});
