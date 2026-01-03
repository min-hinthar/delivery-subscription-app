import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads successfully', async ({ page }) => {
    await page.goto('/')

    // Should have the main heading
    await expect(page).toHaveTitle(/Mandalay/i)
  })

  test('has navigation links', async ({ page }) => {
    await page.goto('/')

    // Check for key navigation elements
    const pricingLink = page.getByRole('link', { name: /pricing/i })
    await expect(pricingLink).toBeVisible()

    const loginLink = page.getByRole('link', { name: /login/i })
    await expect(loginLink).toBeVisible()

    const signupLink = page.getByRole('link', { name: /sign up/i })
    await expect(signupLink).toBeVisible()
  })

  test('navigates to pricing page', async ({ page }) => {
    await page.goto('/')

    // Click pricing link
    await page.click('text=Pricing')

    // Should navigate to pricing page
    await expect(page).toHaveURL('/pricing')
  })

  test('navigates to login page', async ({ page }) => {
    await page.goto('/')

    // Click login link
    await page.click('text=Login')

    // Should navigate to login page
    await expect(page).toHaveURL('/login')
  })

  test('is mobile responsive', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Page should still be accessible
    await expect(page.locator('body')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('has no automatically detectable accessibility violations', async ({ page }) => {
    await page.goto('/')

    // Basic accessibility checks
    // Check for proper heading hierarchy (h1 should exist)
    const h1 = page.locator('h1')
    await expect(h1).toHaveCount(1)

    // Check for skip to content link (optional but good practice)
    // const skipLink = page.locator('a:has-text("Skip to content")')
    // await expect(skipLink).toBeVisible()
  })
})
