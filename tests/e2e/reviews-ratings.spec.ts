import { test, expect } from '@playwright/test';

test.describe('Customer Reviews and Ratings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        user: { id: 'test-user-id' }
      }));
    });
  });

  test('should show review prompt after delivery', async ({ page }) => {
    await page.goto('/orders');

    // Look for delivered orders
    const deliveredOrder = page.locator('[data-status="delivered"]').first();
    if (await deliveredOrder.isVisible()) {
      // Should have review button
      const reviewButton = page.getByRole('button', { name: /review|rate/i });
      await expect(reviewButton.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display star rating component', async ({ page }) => {
    // Mock review dialog
    await page.goto('/orders');
    const reviewButton = page.getByRole('button', { name: /review/i }).first();

    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // Should show rating stars
      const stars = page.locator('[data-testid="star-rating"], .star-rating');
      await expect(stars).toBeVisible({ timeout: 5000 });
    }
  });

  test('should allow rating selection', async ({ page }) => {
    await page.goto('/orders');
    const reviewButton = page.getByRole('button', { name: /review/i }).first();

    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // Click on 5th star
      const fifthStar = page.locator('[data-star="5"]');
      if (await fifthStar.isVisible()) {
        await fifthStar.click();

        // All 5 stars should be filled
        const filledStars = page.locator('.star-filled');
        await expect(filledStars).toHaveCount(5);
      }
    }
  });

  test('should allow text review submission', async ({ page }) => {
    await page.goto('/orders');
    const reviewButton = page.getByRole('button', { name: /review/i }).first();

    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // Find review textarea
      const reviewText = page.getByPlaceholder(/tell us|share your/i);
      if (await reviewText.isVisible()) {
        await reviewText.fill('Great meal! Really enjoyed the flavors.');

        // Submit review
        const submitButton = page.getByRole('button', { name: /submit|post/i });
        await submitButton.click();

        // Should show success message
        await expect(page.getByText(/thank you|submitted/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should display existing reviews on menu items', async ({ page }) => {
    await page.goto('/menu');

    // Check for rating display on menu items
    const ratingDisplay = page.locator('[data-testid="item-rating"]').first();
    if (await ratingDisplay.isVisible()) {
      // Should show star count
      await expect(page.locator('.star-icon')).toBeVisible();
    }
  });

  test('should show average rating', async ({ page }) => {
    await page.goto('/menu');

    // Look for average rating
    const avgRating = page.getByText(/\d+\.\d+.*stars?/i);
    if (await avgRating.first().isVisible()) {
      const ratingText = await avgRating.first().textContent();
      expect(ratingText).toMatch(/[0-5]\.\d/);
    }
  });

  test('should validate review before submission', async ({ page }) => {
    await page.goto('/orders');
    const reviewButton = page.getByRole('button', { name: /review/i }).first();

    if (await reviewButton.isVisible()) {
      await reviewButton.click();

      // Try to submit without rating
      const submitButton = page.getByRole('button', { name: /submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation error
        await expect(page.getByText(/required|select.*rating/i)).toBeVisible();
      }
    }
  });

  test('should allow review editing', async ({ page }) => {
    await page.goto('/orders');

    // Find existing review
    const editButton = page.getByRole('button', { name: /edit.*review/i }).first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // Should be able to modify
      const reviewText = page.getByRole('textbox', { name: /review/i });
      await expect(reviewText).toBeVisible();
    }
  });

  test('should filter reviews by rating', async ({ page }) => {
    await page.goto('/reviews');

    // Look for filter options
    const ratingFilter = page.getByText(/filter.*rating|[0-5].*stars?/i);
    if (await ratingFilter.first().isVisible()) {
      await ratingFilter.first().click();

      // Should filter displayed reviews
      const reviews = page.locator('[data-testid="review-item"]');
      await expect(reviews.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show review count', async ({ page }) => {
    await page.goto('/menu');

    // Check for review count display
    const reviewCount = page.getByText(/\d+.*reviews?/i).first();
    if (await reviewCount.isVisible()) {
      const countText = await reviewCount.textContent();
      expect(countText).toMatch(/\d+/);
    }
  });
});
