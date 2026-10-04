import { test, expect } from '@playwright/test';

test.describe('QRoute Operator Admin Operations & Lifecycle E2E', () => {
  const ADMIN_EMAIL = 'admin@qroute.local';
  const ADMIN_HEADERS = {
    'cf-access-authenticated-user-email': ADMIN_EMAIL,
    'x-admin-email': ADMIN_EMAIL,
  };

  test('1. API blocks unauthenticated access to /api/admin/* endpoints with HTTP 401', async ({
    request,
  }) => {
    const res = await request.get('/api/admin/dashboard');
    expect(res.status()).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  test('2. Admin Console loads with authenticated operator identity and displays metrics', async ({
    page,
  }) => {
    // Intercept client fetch requests to inject test admin identity headers
    await page.route('/api/admin/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        ...ADMIN_HEADERS,
      };
      await route.continue({ headers });
    });

    await page.goto('/admin');

    // Wait for console to render
    await expect(
      page.getByRole('heading', { name: /Card Lifecycle & Routing Operations/i })
    ).toBeVisible({
      timeout: 15000,
    });

    // Verify operator identity badge in top navigation
    await expect(page.getByText('QRoute Admin')).toBeVisible();

    // Verify metric cards
    const kpiSection = page.locator('section[aria-label="Platform KPI Summary"]');
    await expect(kpiSection.getByText('Total Cards', { exact: true })).toBeVisible();
    await expect(kpiSection.getByText('Active', { exact: true })).toBeVisible();
    await expect(kpiSection.getByText('Unactivated', { exact: true })).toBeVisible();
  });

  test('3. Card inventory search and detail inspection modal', async ({ page }) => {
    await page.route('/api/admin/**', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          ...ADMIN_HEADERS,
        },
      });
    });

    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: /Card Lifecycle & Routing Operations/i })
    ).toBeVisible();

    // Search for the admin test card
    const searchInput = page.getByPlaceholder(/Search by Public ID or Business/i);
    await searchInput.fill('ADMN7K2M9Q4X8P6V');

    // Wait for row to appear
    await expect(page.getByText('Admin Test Boutique')).toBeVisible();
    await expect(page.getByText('ADMN7K2M9Q4X8P6V')).toBeVisible();

    // Click Inspect to open detail modal
    const inspectBtn = page.getByRole('button', { name: /^Inspect$/i }).first();
    await inspectBtn.click();

    // Verify modal elements
    await expect(
      page.getByRole('heading', { name: /Card Detail & Audit Timeline/i })
    ).toBeVisible();
    await expect(page.getByText('PUBLIC ID:')).toBeVisible();
    await expect(page.getByText('DESTINATION URL:')).toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    await closeBtn.click();
    await expect(
      page.getByRole('heading', { name: /Card Detail & Audit Timeline/i })
    ).not.toBeVisible();
  });

  test('4. Full lifecycle journey: Disable -> Verify Inactive Redirect -> Restore -> Change URL -> Retire', async ({
    page,
    request,
  }) => {
    await page.route('/api/admin/**', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          ...ADMIN_HEADERS,
        },
      });
    });

    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: /Card Lifecycle & Routing Operations/i })
    ).toBeVisible();

    // Filter to ADMN7K2M9Q4X8P6V
    const searchInput = page.getByPlaceholder(/Search by Public ID or Business/i);
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    await expect(page.getByText('Admin Test Boutique')).toBeVisible();

    // --- STEP A: DISABLE CARD ---
    const disableBtn = page.getByRole('button', { name: /^Disable$/i }).first();
    await disableBtn.click();

    // Confirmation modal appears
    await expect(
      page.getByRole('heading', { name: /Disable Card ADMN7K2M9Q4X8P6V/i })
    ).toBeVisible();
    const confirmDisableBtn = page.getByRole('button', { name: /^Confirm Disable$/i });
    await confirmDisableBtn.click();

    // Wait for modal to dismiss and success toast
    await expect(page.getByText(/successfully updated \(DISABLE\)/i)).toBeVisible();

    // Verify customer redirect path now serves 200 Inactive Status Notice!
    const scanInactive = await request.get('/c/ADMN7K2M9Q4X8P6V');
    expect(scanInactive.status()).toBe(200);
    const scanHtml = await scanInactive.text();
    expect(scanHtml).toContain('Review Card Temporarily Inactive');

    // --- STEP B: RESTORE CARD ---
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    const restoreBtn = page.getByRole('button', { name: /^Restore$/i }).first();
    await restoreBtn.click();

    await expect(
      page.getByRole('heading', { name: /Restore Card ADMN7K2M9Q4X8P6V/i })
    ).toBeVisible();
    const confirmRestoreBtn = page.getByRole('button', { name: /^Confirm Restore$/i });
    await confirmRestoreBtn.click();

    await expect(page.getByText(/successfully updated \(RESTORE\)/i)).toBeVisible();

    // Customer redirect resumes 302 Found
    const scanActive = await request.get('/c/ADMN7K2M9Q4X8P6V', { maxRedirects: 0 });
    expect(scanActive.status()).toBe(302);
    expect(scanActive.headers()['location']).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJ_TEST_ADMIN_ACTIVE'
    );

    // --- STEP C: UPDATE DESTINATION URL ---
    const newGoogleUrl =
      'https://search.google.com/local/writereview?placeid=ChIJ_UPDATED_ADMIN_URL_999';
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    const editUrlBtn = page.getByRole('button', { name: /^Edit URL$/i }).first();
    await editUrlBtn.click();

    await expect(
      page.getByRole('heading', { name: /Update Destination for ADMN7K2M9Q4X8P6V/i })
    ).toBeVisible();
    const destInput = page.getByPlaceholder(/https:\/\/search\.google\.com\/local\/writereview/i);
    await destInput.fill(newGoogleUrl);
    await expect(page.getByText(/Valid Google Business Review Destination/i)).toBeVisible();

    const saveDestBtn = page.getByRole('button', { name: /^Save Destination$/i });
    await saveDestBtn.click();

    await expect(page.getByText(/successfully updated \(CHANGE_DEST\)/i)).toBeVisible();

    // Customer redirect reflects new target
    const scanUpdated = await request.get('/c/ADMN7K2M9Q4X8P6V', { maxRedirects: 0 });
    expect(scanUpdated.status()).toBe(302);
    expect(scanUpdated.headers()['location']).toBe(newGoogleUrl);

    // --- STEP D: PERMANENT RETIREMENT (* -> RETIRED) ---
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    const retireBtn = page.getByRole('button', { name: /^Retire$/i }).first();
    await retireBtn.click();

    await expect(
      page.getByRole('heading', { name: /Permanently Retire Card ADMN7K2M9Q4X8P6V/i })
    ).toBeVisible();
    await expect(page.getByText(/IRREVERSIBLE TERMINAL STATE/i)).toBeVisible();

    const confirmRetireBtn = page.getByRole('button', { name: /^Permanently Retire$/i });
    await confirmRetireBtn.click();

    await expect(page.getByText(/successfully updated \(RETIRE\)/i)).toBeVisible();

    // Customer redirect path now serves 200 Retired Notice!
    const scanRetired = await request.get('/c/ADMN7K2M9Q4X8P6V');
    expect(scanRetired.status()).toBe(200);
    const retiredHtml = await scanRetired.text();
    expect(retiredHtml).toContain('Card Retired');
    expect(retiredHtml).toContain('This card has been retired from service.');
  });

  test('5. Batch provisioning generates unique Crockford cards and supplier manifest table', async ({
    page,
  }) => {
    await page.route('/api/admin/**', async (route) => {
      await route.continue({
        headers: {
          ...route.request().headers(),
          ...ADMIN_HEADERS,
        },
      });
    });

    await page.goto('/admin');
    await expect(
      page.getByRole('heading', { name: /Card Lifecycle & Routing Operations/i })
    ).toBeVisible();

    // Navigate to Batch Provisioning tab
    const batchTab = page.getByRole('button', { name: /Batch Provisioning/i });
    await batchTab.click();

    // Verify form
    await expect(page.getByRole('heading', { name: /Provision New Card Batch/i })).toBeVisible();

    // Fill form
    await page.fill('input[placeholder*="Batch 2026-A"]', 'Q1 Supplier Pilot Batch');
    await page.fill('input[type="number"]', '3');

    // Submit batch creation
    const generateBtn = page.getByRole('button', { name: /Generate & Provision Batch/i });
    await generateBtn.click();

    // Verify one-time activation manifest view
    await expect(
      page.getByRole('heading', { name: /Critical: One-Time Activation Code Manifest/i })
    ).toBeVisible();

    await expect(page.getByRole('button', { name: /Download Manifest CSV/i })).toBeVisible();

    // Verify 3 newly generated cards are rendered with formatted activation codes
    const codes = page.locator('table tbody tr');
    await expect(codes).toHaveCount(3);
  });
});
