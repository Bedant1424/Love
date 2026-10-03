import { test, expect } from '@playwright/test';

test.describe('QRoute Application Foundation Shell E2E', () => {
  test('loads application shell and renders foundation UI primitives', async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Assert document title
    await expect(page).toHaveTitle(/QRoute Platform/i);

    // Assert main heading and description
    const title = page.getByRole('heading', { name: /Foundation Shell/i });
    await expect(title).toBeVisible();

    const badge = page.getByText(/QRoute Platform/i);
    await expect(badge).toBeVisible();

    // Assert interactive re-check button exists and has accessible name
    const button = page.getByRole('button', { name: /Re-check Edge Liveness/i });
    await expect(button).toBeVisible();
    await expect(button).toBeEnabled();
  });
});
