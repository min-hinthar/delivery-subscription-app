import { test, expect } from '@playwright/test'

test.describe('Authentication Flows', () => {
  test.describe('Login', () => {
    test('displays login form', async ({ page }) => {
      await page.goto('/login')

      // Check for login form elements
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /log in/i })).toBeVisible()
    })

    test('shows link to signup page', async ({ page }) => {
      await page.goto('/login')

      const signupLink = page.getByRole('link', { name: /sign up/i })
      await expect(signupLink).toBeVisible()
    })

    test('navigates to signup from login', async ({ page }) => {
      await page.goto('/login')

      await page.click('text=Sign up')
      await expect(page).toHaveURL(/\/signup/)
    })
  })

  test.describe('Signup', () => {
    test('displays signup form', async ({ page }) => {
      await page.goto('/signup')

      // Check for signup form elements
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()
      await expect(page.getByRole('button', { name: /sign up/i })).toBeVisible()
    })

    test('shows link to login page', async ({ page }) => {
      await page.goto('/signup')

      const loginLink = page.getByRole('link', { name: /log in/i })
      await expect(loginLink).toBeVisible()
    })

    test('navigates to login from signup', async ({ page }) => {
      await page.goto('/signup')

      await page.click('text=Log in')
      await expect(page).toHaveURL(/\/login/)
    })
  })

  test.describe('Protected Routes', () => {
    test('redirects to login when accessing protected route without auth', async ({ page }) => {
      // Try to access protected route
      await page.goto('/account')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing schedule without auth', async ({ page }) => {
      await page.goto('/schedule')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })

    test('redirects to login when accessing track without auth', async ({ page }) => {
      await page.goto('/track')

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/)
    })
  })
})
