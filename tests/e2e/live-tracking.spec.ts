import { test, expect } from '@playwright/test'

test.describe('Live Tracking (E2E Harness)', () => {
  test('renders tracking summary and timeline', async ({ page }) => {
    await page.goto('/__e2e__/tracking')

    await expect(page.getByRole('heading', { name: /tracking qa harness/i })).toBeVisible()
    await expect(page.getByTestId('tracking-eta')).toContainText('Arriving in 20 minutes')
    await expect(page.getByTestId('tracking-timeline')).toContainText('Your delivery')
  })

  test('updates ETA and emits notifications', async ({ page }) => {
    await page.goto('/__e2e__/tracking')

    await page.getByTestId('tracking-update-eta').click()
    await expect(page.getByTestId('tracking-eta')).toContainText('Arriving in 8 minutes')

    await page.getByTestId('tracking-driver-nearby').click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Driver is approaching' }),
    ).toBeVisible()

    await page.getByTestId('tracking-delivered').click()
    await expect(
      page.getByRole('alert').filter({ hasText: 'Delivery Completed' }),
    ).toBeVisible()
    await expect(page.getByTestId('tracking-timeline')).toContainText('Delivered')
  })
})
