import { test, expect } from '@playwright/test';

test.describe('QRoute Public Redirect Engine E2E', () => {
  test('ACTIVE card returns 302 redirect with private cache control and no-referrer', async ({
    request,
  }) => {
    const response = await request.get('/c/ACTV123456', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe(
      'https://search.google.com/local/writereview?placeid=ChIJ_TEST_ACTIVE_001'
    );
    expect(response.headers()['cache-control']).toBe(
      'private, no-cache, no-store, must-revalidate'
    );
    expect(response.headers()['referrer-policy']).toBe('no-referrer');
  });

  test('UNACTIVATED card returns 302 redirect targeting /activate/:publicId', async ({
    request,
  }) => {
    const response = await request.get('/c/PEND123456', {
      maxRedirects: 0,
    });

    expect(response.status()).toBe(302);
    expect(response.headers()['location']).toBe('/activate/PEND123456');
  });

  test('DISABLED card renders accessible status page in browser', async ({ page }) => {
    const response = await page.goto('/c/DACT123456');
    expect(response?.status()).toBe(200);

    const heading = page.getByRole('heading', {
      name: /Review Card Temporarily Inactive/i,
    });
    await expect(heading).toBeVisible();

    const notice = page.getByText(
      /This review card is temporarily inactive. Please check back later./i
    );
    await expect(notice).toBeVisible();
  });

  test('RETIRED card renders retired notice in browser', async ({ page }) => {
    const response = await page.goto('/c/RETR123456');
    expect(response?.status()).toBe(200);

    const heading = page.getByRole('heading', { name: /Card Retired/i });
    await expect(heading).toBeVisible();

    const notice = page.getByText(/This card has been retired from service./i);
    await expect(notice).toBeVisible();
  });

  test('UNKNOWN card renders 404 page in browser', async ({ page }) => {
    const response = await page.goto('/c/DOESNOTEXIST');
    expect(response?.status()).toBe(404);

    const heading = page.getByRole('heading', { name: /Card Not Found/i });
    await expect(heading).toBeVisible();

    const notice = page.getByText(
      /Card not found. Please verify that you scanned an official review card./i
    );
    await expect(notice).toBeVisible();
  });
});
