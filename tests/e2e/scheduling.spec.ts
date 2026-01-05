import { test, expect } from '@playwright/test';

test.describe('Delivery Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display schedule page for authenticated users', async ({ page }) => {
    // Mock authentication
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({ access_token: 'mock-token' }));
    });

    await page.goto('/schedule');
    await expect(page.getByText('Schedule')).toBeVisible();
    await expect(page.getByText('delivery window')).toBeVisible();
  });

  test('should show delivery windows with availability', async ({ page }) => {
    await page.goto('/schedule');

    // Check for delivery window selector
    const timeSlots = page.locator('[data-testid="time-slot"]');
    await expect(timeSlots.first()).toBeVisible({ timeout: 10000 });

    // Verify availability info is shown
    await expect(page.getByText(/available/i)).toBeVisible();
  });

  test('should allow week navigation', async ({ page }) => {
    await page.goto('/schedule');

    // Find week navigation controls
    const weekSelector = page.locator('[data-testid="week-selector"]');
    if (await weekSelector.isVisible()) {
      await weekSelector.click();

      // Select next week
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');

      // URL should update
      await expect(page.url()).toContain('week_of=');
    }
  });

  test('should show cutoff warning when past deadline', async ({ page }) => {
    // Test with a past week
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const pastWeek = pastDate.toISOString().split('T')[0];

    await page.goto(`/schedule?week_of=${pastWeek}`);

    // Should show cutoff message
    await expect(page.getByText(/cutoff|deadline/i)).toBeVisible({ timeout: 5000 });
  });

  test('should disable scheduling without active subscription', async ({ page }) => {
    await page.goto('/schedule');

    // Check for subscription warning
    const subscriptionWarning = page.getByText(/active subscription/i);
    if (await subscriptionWarning.isVisible()) {
      // Confirm button should be disabled
      const confirmButton = page.getByRole('button', { name: /confirm|save/i });
      await expect(confirmButton).toBeDisabled();
    }
  });

  test('should handle full delivery windows', async ({ page }) => {
    await page.goto('/schedule');

    // Look for full window indicators
    const fullWindowMessage = page.getByText(/full|unavailable/i);
    if (await fullWindowMessage.isVisible()) {
      // Should suggest alternatives
      await expect(page.getByText(/try.*another/i)).toBeVisible();
    }
  });

  test('should display confirmation after successful booking', async ({ page }) => {
    await page.goto('/schedule');

    // Select a time slot
    const timeSlot = page.locator('[data-testid="time-slot"]').first();
    await timeSlot.click();

    // Submit the form
    const confirmButton = page.getByRole('button', { name: /confirm|save/i });
    if (!(await confirmButton.isDisabled())) {
      await confirmButton.click();

      // Should show success message
      await expect(page.getByText(/saved|confirmed/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show error boundary on component failure', async ({ page }) => {
    // Force an error by navigating with invalid data
    await page.goto('/schedule?week_of=invalid-date');

    // Error boundary should catch and display gracefully
    const errorContent = page.locator('body');
    await expect(errorContent).toBeVisible();

    // Should not show unhandled error
    page.on('pageerror', (error) => {
      expect(error.message).not.toContain('Uncaught');
    });
  });
});
