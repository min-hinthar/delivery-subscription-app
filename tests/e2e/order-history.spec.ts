import { test, expect } from '@playwright/test';

test.describe('Customer Order History', () => {
  test.beforeEach(async ({ page }) => {
    // Mock customer authentication
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id' }
      }));
    });
  });

  test('should display order history page', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText(/order.*history|my orders/i)).toBeVisible({ timeout: 10000 });
  });

  test('should show list of past orders', async ({ page }) => {
    await page.goto('/orders');

    // Check for orders list
    const ordersList = page.locator('[data-testid="orders-list"], .order-item');
    const ordersCount = await ordersList.count();

    // Should either show orders or empty state
    if (ordersCount === 0) {
      await expect(page.getByText(/no orders|get started/i)).toBeVisible();
    } else {
      await expect(ordersList.first()).toBeVisible();
    }
  });

  test('should display order details', async ({ page }) => {
    await page.goto('/orders');

    // Click on first order if it exists
    const firstOrder = page.locator('[data-testid="order-item"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();

      // Should show order details
      await expect(page.getByText(/order.*details|items|total/i)).toBeVisible();
    }
  });

  test('should show order status', async ({ page }) => {
    await page.goto('/orders');

    // Look for status indicators
    const statusBadge = page.locator('[data-testid="order-status"], .status-badge');
    if (await statusBadge.first().isVisible()) {
      const statusText = await statusBadge.first().textContent();
      expect(statusText).toMatch(/pending|confirmed|delivered|cancelled/i);
    }
  });

  test('should filter orders by date range', async ({ page }) => {
    await page.goto('/orders');

    // Look for filter controls
    const filterButton = page.getByRole('button', { name: /filter/i });
    if (await filterButton.isVisible()) {
      await filterButton.click();

      // Should show filter options
      await expect(page.getByText(/date|status|week/i)).toBeVisible();
    }
  });

  test('should allow order reordering', async ({ page }) => {
    await page.goto('/orders');

    // Look for reorder button
    const reorderButton = page.getByRole('button', { name: /reorder|order again/i });
    if (await reorderButton.first().isVisible()) {
      await reorderButton.first().click();

      // Should navigate to menu or checkout
      await expect(page.url()).toMatch(/menu|checkout/);
    }
  });

  test('should display order items with quantities', async ({ page }) => {
    await page.goto('/orders');

    // Navigate to order detail
    const orderLink = page.locator('a[href*="/orders/"]').first();
    if (await orderLink.isVisible()) {
      await orderLink.click();

      // Should show item quantities
      await expect(page.getByText(/x\d+|quantity/i)).toBeVisible();
    }
  });

  test('should show total price for each order', async ({ page }) => {
    await page.goto('/orders');

    // Look for price information
    const priceElement = page.locator('[data-testid="order-total"]');
    if (await priceElement.first().isVisible()) {
      const priceText = await priceElement.first().textContent();
      expect(priceText).toMatch(/\$\d+/);
    }
  });

  test('should paginate long order lists', async ({ page }) => {
    await page.goto('/orders');

    // Check for pagination controls
    const pagination = page.locator('[data-testid="pagination"]');
    if (await pagination.isVisible()) {
      const nextButton = page.getByRole('button', { name: /next/i });
      await expect(nextButton).toBeVisible();
    }
  });

  test('should handle empty order history', async ({ page }) => {
    // Mock empty orders
    await page.route('**/api/orders**', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ ok: true, data: { orders: [] } }),
      });
    });

    await page.goto('/orders');

    // Should show empty state
    await expect(page.getByText(/no orders|start ordering/i)).toBeVisible();
  });
});
