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

  test('3. Card inventory search, compact details modal, and edit metadata modal', async ({
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

    // Search for the admin test card
    const searchInput = page.getByPlaceholder(/Search by Public ID or Business/i);
    await searchInput.fill('ADMN7K2M9Q4X8P6V');

    // Wait for row to appear
    await expect(page.getByText('Admin Test Boutique')).toBeVisible();
    await expect(page.getByText('ADMN7K2M9Q4X8P6V')).toBeVisible();

    // Click Public ID button to open compact detail modal
    const publicIdBtn = page.getByRole('button', { name: 'ADMN7K2M9Q4X8P6V', exact: true });
    await publicIdBtn.click();

    // Verify compact modal elements
    await expect(page.getByRole('heading', { name: /^Card Details$/i })).toBeVisible();
    await expect(page.getByText('STATUS')).toBeVisible();
    await expect(page.getByText('GOOGLE REVIEW URL')).toBeVisible();
    await expect(page.getByText(/System Record ID/i)).not.toBeVisible();

    // Close modal
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    await closeBtn.click();
    await expect(page.getByRole('heading', { name: /^Card Details$/i })).not.toBeVisible();

    // Click Edit button to open Edit Card modal
    const editBtn = page.getByRole('button', { name: /Edit card ADMN7K2M9Q4X8P6V/i });
    await editBtn.click();

    // Verify Edit Card modal
    await expect(page.getByRole('heading', { name: /^Edit Card$/i })).toBeVisible();
    await expect(page.getByText('Public ID (Immutable)')).toBeVisible();
    await expect(page.getByText('Permanently Locked')).toBeVisible();

    // Edit non-routing business name
    const businessNameInput = page.locator('input[placeholder*="Acme Coffee"]');
    await expect(businessNameInput).toBeVisible();
    await businessNameInput.fill('Admin Test Boutique Edited');

    // Save Changes
    const saveBtn = page.getByRole('button', { name: /^Save Changes$/i });
    await saveBtn.click();

    // Verify success toast and row update
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
    await expect(page.getByText('Admin Test Boutique Edited')).toBeVisible();

    // Revert business name to maintain baseline
    await editBtn.click();
    await businessNameInput.fill('Admin Test Boutique');
    await saveBtn.click();
    await expect(page.getByText(/updated successfully/i)).toBeVisible();
  });

  test('4. Full lifecycle journey: Disable -> Verify Inactive Redirect -> Restore -> Verify Locked Destination (No Change URL) -> Retire', async ({
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
    await page.getByRole('button', { name: /More actions for card ADMN7K2M9Q4X8P6V/i }).click();
    const disableBtn = page.getByRole('button', { name: /^Disable Card$/i });
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
    await page.getByRole('button', { name: /More actions for card ADMN7K2M9Q4X8P6V/i }).click();
    const restoreBtn = page.getByRole('button', { name: /^Restore Card$/i });
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

    // --- STEP C: VERIFY DESTINATION IS LOCKED (NO CHANGE URL CAPABILITY) ---
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    // Verify "Edit URL" button does NOT exist on the active card row
    await expect(page.getByRole('button', { name: /^Edit URL$/i })).not.toBeVisible();

    // Verify Edit Card modal shows locked destination and no URL input field
    const editBtn = page.getByRole('button', { name: /Edit card ADMN7K2M9Q4X8P6V/i });
    await editBtn.click();
    await expect(page.getByText('Permanently Locked')).toBeVisible();
    await expect(
      page.locator('input[name="destinationUrl"], input[placeholder*="google.com"]')
    ).toHaveCount(0);
    const cancelEditBtn = page.getByRole('button', { name: /^Cancel$/i });
    await cancelEditBtn.click();

    // Verify backend rejects attempts to change destination with 404 (endpoint removed)
    const changeAttempt = await request.post(
      '/api/admin/cards/ADMN7K2M9Q4X8P6V/change-destination',
      {
        headers: {
          'Content-Type': 'application/json',
          ...ADMIN_HEADERS,
        },
        data: JSON.stringify({
          destinationUrl:
            'https://search.google.com/local/writereview?placeid=ChIJ_UNAUTHORIZED_MUTATION',
        }),
      }
    );
    expect(changeAttempt.status()).toBe(404);

    // Verify customer redirect continues to point to original destination
    const scanStillActive = await request.get('/c/ADMN7K2M9Q4X8P6V', { maxRedirects: 0 });
    expect(scanStillActive.status()).toBe(302);
    expect(scanStillActive.headers()['location']).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJ_TEST_ADMIN_ACTIVE'
    );

    // --- STEP D: PERMANENT RETIREMENT (* -> RETIRED) ---
    await searchInput.fill('ADMN7K2M9Q4X8P6V');
    await page.getByRole('button', { name: /More actions for card ADMN7K2M9Q4X8P6V/i }).click();
    const retireBtn = page.getByRole('button', { name: /^Retire Card$/i });
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
    const generateBtn = page.getByRole('button', { name: /^Generate Batch$/i });
    await generateBtn.click();

    // Verify immediate batch success state
    const successState = page.getByTestId('batch-success-state');
    await expect(successState).toBeVisible();
    await expect(page.getByRole('heading', { name: /Batch Created Successfully/i })).toBeVisible();
    await expect(successState.getByText('Q1 Supplier Pilot Batch')).toBeVisible();
    await expect(successState.getByText('UNACTIVATED')).toBeVisible();

    // Verify primary and secondary CTAs
    await expect(page.getByTestId('export-batch-cta')).toBeVisible();
    await expect(page.getByRole('button', { name: /View in Inventory/i })).toBeVisible();

    // Verify 3 newly generated cards are rendered
    const codes = page.locator('table tbody tr');
    await expect(codes).toHaveCount(3);
  });
});
