import { test, expect } from '@playwright/test'

test.describe('i18n', () => {
  test('switches to Burmese and persists locale', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: 'Morning Star Delivery' })).toBeVisible()

    await page.getByRole('button', { name: 'မြန်မာ' }).click()

    await expect(page).toHaveURL(/\/my\/?$/)
    await expect(page.getByRole('link', { name: 'မော်နင်း စတား ပို့ဆောင်မှု' })).toBeVisible()

    const cookies = await page.evaluate(() => document.cookie)
    expect(cookies).toContain('NEXT_LOCALE=my')
  })

  test('switches back to English from Burmese', async ({ page }) => {
    await page.goto('/my')

    await page.getByRole('button', { name: 'English' }).click()

    await expect(page).toHaveURL(/\/$/)
  })
})
