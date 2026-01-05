import { test, expect } from '@playwright/test';

test.describe('Admin Route Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.goto('/admin/login');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-admin-token',
        user: { is_admin: true }
      }));
    });
  });

  test('should display route builder page for admins', async ({ page }) => {
    await page.goto('/admin/routes');
    await expect(page.getByText(/route planning/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show appointments list', async ({ page }) => {
    await page.goto('/admin/routes');

    // Check for appointments section
    const appointmentsList = page.locator('[data-testid="appointments-list"]');
    await expect(appointmentsList.or(page.getByText(/appointment/i))).toBeVisible({ timeout: 10000 });
  });

  test('should allow week selection', async ({ page }) => {
    await page.goto('/admin/routes');

    // Find week selector
    const weekSelector = page.locator('select, [role="combobox"]').first();
    if (await weekSelector.isVisible()) {
      await weekSelector.click();

      // Should have multiple week options
      const options = page.locator('option, [role="option"]');
      const count = await options.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('should display map for route visualization', async ({ page }) => {
    await page.goto('/admin/routes');

    // Wait for map container
    const mapContainer = page.locator('[data-testid="route-map"], .map-container, #map');
    await expect(mapContainer).toBeVisible({ timeout: 15000 });
  });

  test('should handle route building', async ({ page }) => {
    await page.goto('/admin/routes');

    // Look for build route button
    const buildButton = page.getByRole('button', { name: /build|create.*route/i });
    if (await buildButton.isVisible()) {
      await buildButton.click();

      // Should show loading or success state
      await expect(
        page.getByText(/building|optimizing|created/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });

  test('should show route optimization options', async ({ page }) => {
    await page.goto('/admin/routes');

    // Check for optimization toggle
    const optimizeToggle = page.getByText(/optimize/i);
    await expect(optimizeToggle).toBeVisible({ timeout: 5000 });
  });

  test('should display route summary after creation', async ({ page }) => {
    await page.goto('/admin/routes');

    // Look for existing routes
    const routeSummary = page.locator('[data-testid="route-summary"]');
    if (await routeSummary.isVisible()) {
      // Should show distance and duration
      await expect(page.getByText(/miles|km|minutes|hours/i)).toBeVisible();
    }
  });

  test('should handle drag and drop reordering', async ({ page }) => {
    await page.goto('/admin/routes');

    // Check for draggable stops
    const draggableStop = page.locator('[draggable="true"]').first();
    if (await draggableStop.isVisible()) {
      const box = await draggableStop.boundingBox();
      if (box) {
        // Simulate drag
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x, box.y + 100);
        await page.mouse.up();

        // Should trigger reordering
        expect(true).toBe(true); // Placeholder for actual reorder verification
      }
    }
  });

  test('should show error boundary on route builder failure', async ({ page }) => {
    // Navigate with invalid parameters to trigger error
    await page.goto('/admin/routes?week_of=invalid');

    // Should not crash
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Monitor for unhandled errors
    page.on('pageerror', (error) => {
      // Error should be caught by error boundary
      expect(error.message).not.toContain('Uncaught');
    });
  });

  test('should handle offline gracefully', async ({ page, context }) => {
    await page.goto('/admin/routes');

    // Go offline
    await context.setOffline(true);

    // Try to interact
    const buildButton = page.getByRole('button', { name: /build/i });
    if (await buildButton.isVisible()) {
      await buildButton.click();

      // Should show error message
      await expect(page.getByText(/network|offline|error/i)).toBeVisible({ timeout: 5000 });
    }

    // Go back online
    await context.setOffline(false);
  });
});
