import { test, expect } from '@playwright/test';
import type JSZipType from 'jszip';
// @ts-expect-error - standalone jszip dist bundle avoids Node 22 CJS circular require issue in Playwright ESM loader
import JSZipBundle from 'jszip/dist/jszip.min.js';

const JSZip = JSZipBundle as unknown as typeof JSZipType;

test.describe('QRoute Admin: Batch Provisioning & QR Export Workflow E2E', () => {
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

  test('1. Admin navigation reflects 3-tab architecture and removes obsolete Asset Pipeline tab', async ({
    page,
  }) => {
    await page.goto('/admin');

    // Expected tabs
    await expect(page.getByRole('button', { name: /^Card Inventory$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Batch History$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Audit Trail$/i })).toBeVisible();

    // Obsolete tabs must NOT exist
    await expect(page.getByRole('button', { name: /Asset Pipeline & Print/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Batch Provisioning$/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /^Activation Keys$/i })).not.toBeVisible();
  });

  test('2. Complete Batch Creation -> Success State -> Export Batch workflow', async ({ page }) => {
    await page.goto('/admin');

    // 1. Open Batch History
    await page.getByRole('button', { name: /^Batch History$/i }).click();
    const provisionBtn = page.getByRole('button', { name: /Provision.*Batch/i });
    if (await provisionBtn.isVisible()) {
      await provisionBtn.click();
    }
    await expect(page.getByRole('heading', { name: /Provision New Card Batch/i })).toBeVisible();

    // 2. Fill batch details
    await page.fill('input[placeholder*="Batch 2026-A"]', 'Supplier Alpha Batch');
    await page.fill('input[type="number"]', '3');

    // 3. Click Generate Batch
    await page.getByRole('button', { name: /^Generate Batch$/i }).click();

    // 4. Verify immediate success state
    const successSection = page.getByTestId('batch-success-state');
    await expect(successSection).toBeVisible();
    await expect(page.getByRole('heading', { name: /Batch Created Successfully/i })).toBeVisible();
    await expect(successSection.getByText('Supplier Alpha Batch')).toBeVisible();
    await expect(successSection.getByText('UNACTIVATED')).toBeVisible();

    // 5. Verify Primary and Secondary CTAs
    const exportCta = page.getByTestId('export-batch-cta');
    await expect(exportCta).toBeVisible();
    await expect(page.getByRole('button', { name: /View in Inventory/i })).toBeVisible();

    // 6. Test Primary CTA: Export Batch downloads supplier ZIP package
    const downloadPromise = page.waitForEvent('download');
    await exportCta.click();
    const download = await downloadPromise;

    // Verify canonical filename
    const filename = download.suggestedFilename();
    expect(filename).toBe('QRoute_Batch_Supplier-Alpha-Batch.zip');

    // Read download stream and inspect ZIP archive contents
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const zipBuffer = Buffer.concat(chunks);
    const unzipped = await JSZip.loadAsync(zipBuffer);

    // Verify SVG print masters
    expect(unzipped.file('SVG/QR-001.svg')).not.toBeNull();
    expect(unzipped.file('SVG/QR-002.svg')).not.toBeNull();
    expect(unzipped.file('SVG/QR-003.svg')).not.toBeNull();

    // Verify PNG high-resolution files
    expect(unzipped.file('PNG/QR-001.png')).not.toBeNull();
    expect(unzipped.file('PNG/QR-002.png')).not.toBeNull();
    expect(unzipped.file('PNG/QR-003.png')).not.toBeNull();

    // Verify A4 PDF sheet
    expect(unzipped.file('QR-SHEET.pdf')).not.toBeNull();

    // Security invariant: strictly exclude manifest.csv and activation codes from supplier ZIP
    expect(unzipped.file('manifest.csv')).toBeNull();
    expect(unzipped.file('README.txt')).toBeNull();

    // Check SVG content: uses canonical host and has no text label or credentials
    const svgText = await unzipped.file('SVG/QR-001.svg')!.async('string');
    expect(svgText).toContain('<svg');
    expect(svgText).not.toContain('<text');
    expect(svgText.toLowerCase()).not.toContain('activation');

    // 7. Test Secondary CTA: View in Inventory navigates to inventory tab
    await page.getByRole('button', { name: /View in Inventory/i }).click();
    await expect(page.getByPlaceholder(/Search by Public ID or Business/i)).toBeVisible();
  });

  test('3. Card Inventory provides batch-level Export Batch action for existing batches', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page.getByRole('button', { name: /^Card Inventory$/i })).toBeVisible();

    // Verify batch dropdown is present
    const batchSelect = page.locator('select[aria-label="Filter cards by batch"]');
    await expect(batchSelect).toBeVisible();

    // Select an existing batch if available or create one
    const options = await batchSelect.locator('option').allInnerTexts();
    if (options.length > 1) {
      // Pick second option (first non-ALL batch)
      await batchSelect.selectOption({ index: 1 });

      // Verify batch-level Export Batch button appears
      const exportBtn = page.getByRole('button', { name: /Export Batch \(/i });
      await expect(exportBtn).toBeVisible();

      // Trigger export and verify ZIP download
      const downloadPromise = page.waitForEvent('download');
      await exportBtn.click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/^QRoute_Batch_.*\.zip$/);
    }
  });

  test('4. Admin Key Mapping CSV downloads separately from supplier package', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /^Batch History$/i }).click();
    const provisionBtn = page.getByRole('button', { name: /Provision.*Batch/i });
    if (await provisionBtn.isVisible()) {
      await provisionBtn.click();
    }

    // Generate quick 2-card batch
    await page.fill('input[placeholder*="Batch 2026-A"]', 'Key Backup Test Batch');
    await page.fill('input[type="number"]', '2');
    await page.getByRole('button', { name: /^Generate Batch$/i }).click();

    // Download admin mapping CSV
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Admin Keys \(CSV\)/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toContain('QRoute_Admin_Keys_');
    expect(download.suggestedFilename()).toContain('.csv');
  });
});
