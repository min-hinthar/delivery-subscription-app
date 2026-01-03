# Testing Strategy & Infrastructure

**Created:** 2026-01-03
**Owner:** Claude Code
**Status:** ✅ Implemented

---

## 🎯 Testing Goals

### Primary Objectives
1. **Prevent Regressions** - Catch bugs before production
2. **Enable Confident Refactoring** - Safe code improvements
3. **Document Behavior** - Tests as living documentation
4. **Improve Code Quality** - TDD encourages better design
5. **Reduce Manual QA** - Automate repetitive testing

### Target Coverage
- **Unit Tests:** 80% coverage for utility functions, lib code
- **Component Tests:** 70% coverage for UI components
- **Integration Tests:** Key user flows (auth, subscription, scheduling)
- **E2E Tests:** Critical paths (signup → subscribe → schedule delivery)

---

## 📊 Testing Pyramid

```
        /\
       /E2E\         5-10 tests (slow, high value)
      /------\
     /  INT   \      20-30 tests (medium speed)
    /----------\
   /   UNIT     \    100+ tests (fast, focused)
  /--------------\
```

### Unit Tests (Bottom - Most Tests)
- **Tools:** Vitest
- **Target:** Pure functions, utilities, helpers
- **Speed:** < 1ms per test
- **Examples:**
  - Date/time utilities
  - Validation helpers
  - String formatters
  - Math calculations

### Component Tests (Middle - Moderate Tests)
- **Tools:** Vitest + React Testing Library
- **Target:** UI components in isolation
- **Speed:** 10-50ms per test
- **Examples:**
  - Button interactions
  - Form validation
  - Modal behavior
  - Loading states
  - Error boundaries

### Integration Tests (Top Middle - Fewer Tests)
- **Tools:** Vitest + MSW (Mock Service Worker)
- **Target:** Component + API interactions
- **Speed:** 100-500ms per test
- **Examples:**
  - Login flow (form → API → redirect)
  - Schedule appointment (calendar → validation → API)
  - Stripe checkout creation

### E2E Tests (Top - Fewest Tests)
- **Tools:** Playwright
- **Target:** Complete user journeys
- **Speed:** 2-10s per test
- **Examples:**
  - New user signup → onboarding → subscribe
  - Admin login → create route → export manifest
  - Customer schedule appointment → track delivery

---

## 🛠️ Technology Stack

### Vitest (Unit + Component Tests)
**Why Vitest?**
- ✅ Native ESM support
- ✅ Fast (powered by Vite)
- ✅ Jest-compatible API (easy migration)
- ✅ Built-in TypeScript support
- ✅ Hot module reload for tests
- ✅ Component testing with @testing-library/react
- ✅ Coverage reports (v8 or istanbul)

**Alternative Considered:** Jest (slower, more configuration)

### React Testing Library (Component Tests)
**Why RTL?**
- ✅ Test components like users interact with them
- ✅ Accessibility-first approach
- ✅ Discourages testing implementation details
- ✅ Works with Vitest out of the box
- ✅ Large community and best practices

**Principles:**
- Test user behavior, not implementation
- Query by accessible roles/labels
- Avoid testing internal state

### Playwright (E2E Tests)
**Why Playwright?**
- ✅ Multi-browser testing (Chromium, Firefox, WebKit)
- ✅ Auto-wait for elements (reduces flakiness)
- ✅ Network interception and mocking
- ✅ Screenshots and video recording on failure
- ✅ Parallel test execution
- ✅ TypeScript support
- ✅ Trace viewer for debugging

**Alternative Considered:** Cypress (more opinionated, slower)

### MSW - Mock Service Worker (API Mocking)
**Why MSW?**
- ✅ Intercepts requests at network level
- ✅ Works in both tests and browser
- ✅ Realistic API mocking
- ✅ Same handlers for dev and tests
- ✅ Type-safe with TypeScript

---

## 📁 Test Directory Structure

```
delivery-subscription-app/
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   └── date.test.ts          # Unit tests
│   │   ├── maps/
│   │   │   ├── geocode.ts
│   │   │   └── geocode.test.ts       # Unit tests
│   │   └── auth/
│   │       ├── guards.ts
│   │       └── guards.test.ts        # Unit tests
│   └── components/
│       ├── ui/
│       │   ├── button.tsx
│       │   └── button.test.tsx        # Component tests
│       └── auth/
│           ├── login-form.tsx
│           └── login-form.test.tsx    # Component tests
├── tests/
│   ├── integration/
│   │   ├── auth.test.ts               # Auth flow integration tests
│   │   ├── scheduling.test.ts         # Scheduling integration tests
│   │   └── billing.test.ts            # Stripe integration tests
│   ├── e2e/
│   │   ├── customer-journey.spec.ts   # Full customer flow
│   │   ├── admin-workflow.spec.ts     # Admin operations
│   │   └── auth-flows.spec.ts         # Authentication E2E
│   └── mocks/
│       ├── handlers.ts                 # MSW request handlers
│       └── server.ts                   # MSW server setup
├── vitest.config.ts                    # Vitest configuration
├── playwright.config.ts                # Playwright configuration
└── .github/
    └── workflows/
        └── test.yml                    # CI test automation
```

---

## ⚙️ Configuration

### Vitest Config (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.ts',
        '**/*.d.ts',
        '.next/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
```

### Playwright Config (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 🧪 Test Examples

### Unit Test Example
```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect } from 'vitest'
import { formatDeliveryDate, isCutoffPassed } from './date'

describe('formatDeliveryDate', () => {
  it('formats date in readable format', () => {
    const date = new Date('2026-01-03T10:00:00')
    expect(formatDeliveryDate(date)).toBe('Friday, January 3, 2026')
  })
})

describe('isCutoffPassed', () => {
  it('returns true after Friday 5pm PT', () => {
    const fridayEvening = new Date('2026-01-03T17:01:00-08:00')
    expect(isCutoffPassed(fridayEvening)).toBe(true)
  })

  it('returns false before Friday 5pm PT', () => {
    const fridayAfternoon = new Date('2026-01-03T16:59:00-08:00')
    expect(isCutoffPassed(fridayAfternoon)).toBe(false)
  })
})
```

### Component Test Example
```typescript
// src/components/ui/button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './button'

describe('Button', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### E2E Test Example
```typescript
// tests/e2e/customer-journey.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Customer Journey', () => {
  test('new user can sign up and subscribe', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/')

    // Click sign up
    await page.click('text=Sign Up')

    // Fill signup form
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    // Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding')

    // Complete profile
    await page.fill('input[name="fullName"]', 'Test User')
    await page.fill('input[name="phone"]', '555-0123')
    await page.click('button:has-text("Continue")')

    // Add address
    await page.fill('input[name="address"]', '123 Main St, Covina, CA 91722')
    await page.click('button:has-text("Verify Address")')
    await page.waitForLoadState('networkidle')
    await page.click('button:has-text("Save Address")')

    // Should redirect to account
    await expect(page).toHaveURL('/account')

    // Subscribe to plan
    await page.click('text=Subscribe')
    await expect(page).toHaveURL(/\/subscribe/)

    // Should see Stripe checkout (mocked in test env)
    await expect(page.locator('text=Weekly Delivery Plan')).toBeVisible()
  })
})
```

---

## 📝 Test Writing Guidelines

### DO ✅
- **Test user behavior**, not implementation details
- **Use accessible queries** (getByRole, getByLabelText)
- **Test edge cases** (empty states, errors, loading)
- **Keep tests focused** (one assertion per test when possible)
- **Mock external dependencies** (APIs, databases, Stripe)
- **Use descriptive test names** (what it does, when, expected result)

### DON'T ❌
- Test internal component state
- Test library code (React, Next.js)
- Create brittle tests tied to CSS classes
- Test multiple scenarios in one test
- Rely on test execution order
- Use timeouts/sleeps (use proper waits)

---

## 🚀 Running Tests

### NPM Scripts (to be added)
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

### Commands
```bash
# Run all unit/component tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run specific test file
pnpm test src/lib/utils/date.test.ts

# Run tests matching pattern
pnpm test auth
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install
      - run: npx playwright install --with-deps

      - run: pnpm test:e2e

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📈 Success Metrics

### Code Coverage Targets
- **Overall:** 75%+
- **Critical paths:** 90%+ (auth, payments, scheduling)
- **Utils/libs:** 80%+
- **Components:** 70%+

### Test Performance
- **Unit tests:** < 5 seconds total
- **Component tests:** < 10 seconds total
- **E2E tests:** < 2 minutes total

### Quality Metrics
- **Flaky test rate:** < 2%
- **Test maintenance time:** < 10% of development time
- **Bug detection rate:** 80%+ of bugs caught by tests

---

## 🔄 Testing Workflow

### For New Features
1. **Write test first** (TDD when possible)
2. **Implement feature** to make test pass
3. **Refactor** while keeping tests green
4. **Add edge case tests**
5. **Check coverage** (should increase)

### For Bug Fixes
1. **Write failing test** that reproduces bug
2. **Fix the bug** to make test pass
3. **Ensure no regressions** (all tests pass)
4. **Consider related edge cases**

### Before PR Merge
1. **All tests pass** (`pnpm test && pnpm test:e2e`)
2. **Coverage maintained** or improved
3. **No skipped tests** without good reason
4. **Tests added** for new functionality

---

## 🎓 Learning Resources

### Vitest
- [Vitest Documentation](https://vitest.dev/)
- [Vitest Best Practices](https://vitest.dev/guide/best-practices)

### React Testing Library
- [RTL Documentation](https://testing-library.com/react)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Playwright
- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)

### General Testing
- [Testing JavaScript](https://testingjavascript.com/) by Kent C. Dodds
- [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

## 📋 Next Steps

1. ✅ Install Vitest and dependencies
2. ✅ Configure Vitest for Next.js 16
3. ✅ Set up React Testing Library
4. ✅ Install Playwright
5. ✅ Create example tests
6. ✅ Set up GitHub Actions
7. ⏳ Train team on testing practices
8. ⏳ Add tests to existing critical code
9. ⏳ Achieve 75% coverage baseline

---

**Last Updated:** 2026-01-03
**Next Review:** 2026-01-10
**Owner:** Claude Code
