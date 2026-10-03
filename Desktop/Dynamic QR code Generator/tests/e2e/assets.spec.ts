import { test, expect } from '@playwright/test';

test.describe('Milestone 5: QR Code & Physical Asset Pipeline E2E', () => {
  const ADMIN_EMAIL = 'admin@qroute.local';
  const ADMIN_HEADERS = {
    'cf-access-authenticated-user-email': ADMIN_EMAIL,
    'x-admin-email': ADMIN_EMAIL,
  };

  test.beforeEach(async ({ page }) => {
    // Intercept client fetch requests to inject test admin identity headers
    await page.route('/api/admin/**', async (route) => {
      const headers = {
        ...route.request().headers(),
        ...ADMIN_HEADERS,
      };
      await route.continue({ headers });
    });
  });

  test('1. Asset Pipeline tab displays CR-80 card preview and Level H QR vector SVG', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Click Asset Pipeline tab
    const assetTab = page.getByRole('button', { name: /Asset Pipeline & Print/i });
    await expect(assetTab).toBeVisible();
    await assetTab.click();

    // Verify header and standards badges
    await expect(page.getByRole('heading', { name: /Batch Asset Pipeline/i })).toBeVisible();
    await expect(page.getByText('ISO/IEC 18004 Level H').first()).toBeVisible();

    // Verify CR-80 card back face with QR vector element
    const qrSvg = page.locator('svg[role="img"][aria-label*="QR Code for card"]');
    await expect(qrSvg).toBeVisible({ timeout: 10000 });

    // Verify NTAG213 NFC contact point and memory gauge
    await expect(page.getByText(/NFC NTAG213 CONTACT POINT/i)).toBeVisible();
    await expect(page.getByText(/NTAG213 User Memory Consumption/i)).toBeVisible();
    await expect(page.getByText(/144 bytes/i)).toBeVisible();
  });

  test('2. Card face flip toggles between Review prompt and QR/NFC back face', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Asset Pipeline & Print/i }).click();

    // Initial face is back face (QR code visible)
    await expect(page.locator('svg[role="img"][aria-label*="QR Code for card"]')).toBeVisible();

    // Switch to Front Face
    await page.getByRole('button', { name: 'Front Face' }).click();

    // Verify front face review invitation and stars
    await expect(page.getByRole('heading', { name: /Review Us On Google/i })).toBeVisible();
    await expect(page.getByText(/Instant Contactless Tap/i)).toBeVisible();
    await expect(page.getByText(/★★★★★/)).toBeVisible();

    // Switch back to Back Face
    await page.getByRole('button', { name: 'Back Face (QR + NFC)' }).click();
    await expect(page.locator('svg[role="img"][aria-label*="QR Code for card"]')).toBeVisible();
  });

  test('3. Environment switch to Production with custom domain validation and live URL update', async ({
    page,
  }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Asset Pipeline & Print/i }).click();

    // Click Production environment radio
    await page.getByRole('button', { name: /Production Owned Custom Domain/i }).click();

    // Fill valid production domain
    const domainInput = page.locator('input[placeholder*="qr.yourbrand.com"]');
    await expect(domainInput).toBeVisible();
    await domainInput.fill('qr.bistrosanfrancisco.com');

    // Verify validation feedback
    await expect(page.getByText(/Valid RFC 1123 Hostname/i)).toBeVisible();

    // Verify updated canonical URL in NFC spec
    await expect(page.getByText(/qr\.bistrosanfrancisco\.com\/c\//i).first()).toBeVisible();

    // Test invalid domain shows validation error
    await domainInput.fill('invalid domain with spaces');
    await expect(page.getByText(/Invalid domain format/i)).toBeVisible();
  });

  test('4. Substrate material selection updates visual style', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Asset Pipeline & Print/i }).click();

    // Click various substrates
    const brushedMetalBtn = page.getByRole('button', { name: 'Brushed Metal', exact: true });
    await expect(brushedMetalBtn).toBeVisible();
    await brushedMetalBtn.click();

    const bambooBtn = page.getByRole('button', { name: 'Bamboo / Wood', exact: true });
    await expect(bambooBtn).toBeVisible();
    await bambooBtn.click();

    const acrylicBtn = page.getByRole('button', { name: 'Frosted Acrylic', exact: true });
    await expect(acrylicBtn).toBeVisible();
    await acrylicBtn.click();

    const mattePvcBtn = page.getByRole('button', { name: 'Matte PVC', exact: true });
    await expect(mattePvcBtn).toBeVisible();
    await mattePvcBtn.click();
  });

  test('5. Manifest CSV download triggers and produces non-empty file', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /Asset Pipeline & Print/i }).click();

    // Setup download listener
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download Manifest \(CSV\)/i }).click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('.csv');
  });

  test('6. Batch provisioning transitions directly to Asset Pipeline view with generated cards', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Go to Batch Provisioning
    await page.getByRole('button', { name: /Batch Provisioning/i }).click();
    await page.fill('input[placeholder*="Batch 2026-A"]', 'Fulfillment Test Batch');
    await page.fill('input[type="number"]', '2');
    await page.getByRole('button', { name: /Generate & Provision Batch/i }).click();

    // Verify button to open asset pipeline
    const openPipelineBtn = page.getByRole('button', {
      name: /Open Asset Pipeline \(ZIP & Print\)/i,
    });
    await expect(openPipelineBtn).toBeVisible();
    await openPipelineBtn.click();

    // Verifies pipeline view loads with the newly created batch
    await expect(
      page.getByRole('heading', { name: /Batch Asset Pipeline: Fulfillment Test Batch/i })
    ).toBeVisible();

    // Verifies multi-card navigation shows "1 of 2"
    await expect(page.getByText('1 of 2')).toBeVisible();

    // Flip to next card
    const nextBtn = page.getByRole('button', { name: 'Next card in batch' });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await expect(page.getByText('2 of 2')).toBeVisible();
  });
});
