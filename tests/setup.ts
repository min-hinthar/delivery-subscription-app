import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Extend expect with jest-dom matchers
// This is already done by importing '@testing-library/jest-dom/vitest' above
