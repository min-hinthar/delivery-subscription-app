# 🧪 Comprehensive Testing & QA Guide

**Complete Testing Strategy for Mandalay Morning Star Production Launch**

This guide provides step-by-step testing procedures for all features before production deployment.

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Environment Setup](#test-environment-setup)
3. [Unit & Integration Tests](#unit--integration-tests)
4. [E2E Testing](#e2e-testing)
5. [Manual Testing Checklists](#manual-testing-checklists)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Mobile Testing](#mobile-testing)
10. [Burmese Language Testing](#burmese-language-testing)
11. [User Acceptance Testing](#user-acceptance-testing)
12. [Production Smoke Tests](#production-smoke-tests)

---

## 🎯 Testing Philosophy

### Goals:
- **Zero critical bugs** in production
- **90%+ test coverage** for business logic
- **Mobile-first** testing approach
- **Community validation** before launch
- **Continuous monitoring** post-launch

### Test Pyramid:
```
     /\
    /E2E\        10% - E2E tests
   /______\
  /        \
 /Integration\ 30% - Integration tests
/____________\
/              \
/  Unit Tests   \ 60% - Unit tests
/________________\
```

---

## 🔧 Test Environment Setup

### 1. Local Testing Environment

```bash
# Install testing dependencies
npm install --save-dev \
  @playwright/test \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  vitest \
  @vitest/ui \
  msw

# Set up test database
supabase db reset --local
supabase db seed

# Environment variables for testing
cp .env.example .env.test
```

**Create:** `.env.test`
```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-test-service-role-key
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
```

### 2. Staging Environment

```bash
# Deploy to staging
vercel --env staging

# Use staging Supabase project
supabase link --project-ref staging-project-ref

# Seed staging database
npm run seed:staging
```

---

## 🧩 Unit & Integration Tests

### Setup Vitest

**Create:** `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Create:** `src/test/setup.ts`

```typescript
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
```

### Example Unit Tests

**Create:** `src/lib/__tests__/haptics.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isHapticSupported,
  hapticLight,
  hapticSuccess,
  hapticError,
} from '../haptics';

describe('Haptics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect haptic support', () => {
    Object.defineProperty(navigator, 'vibrate', {
      value: vi.fn(),
      writable: true,
    });

    expect(isHapticSupported()).toBe(true);
  });

  it('should trigger light haptic', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
    });

    hapticLight();

    expect(vibrateMock).toHaveBeenCalledWith(10);
  });

  it('should trigger success pattern', () => {
    const vibrateMock = vi.fn();
    Object.defineProperty(navigator, 'vibrate', {
      value: vibrateMock,
      writable: true,
    });

    hapticSuccess();

    expect(vibrateMock).toHaveBeenCalledWith([10, 50, 10]);
  });
});
```

**Create:** `src/components/menu/__tests__/package-selector.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PackageSelector } from '../package-selector';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe('PackageSelector', () => {
  it('should render all packages', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            packages: [
              { id: '1', name: 'Package A', price_cents: 8500 },
              { id: '2', name: 'Package B', price_cents: 15500 },
              { id: '3', name: 'Package C', price_cents: 22000 },
            ],
          }),
      })
    ) as any;

    render(<PackageSelector weeklyMenuId="test-menu-id" />);

    expect(await screen.findByText('Package A')).toBeInTheDocument();
    expect(await screen.findByText('Package B')).toBeInTheDocument();
    expect(await screen.findByText('Package C')).toBeInTheDocument();
  });

  it('should select package on click', async () => {
    render(<PackageSelector weeklyMenuId="test-menu-id" />);

    const packageB = await screen.findByText('Package B');
    fireEvent.click(packageB);

    expect(await screen.findByText('Selected')).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode (visual test runner)
npm run test:ui
```

**Test Coverage Goals:**
- **Utilities:** 90%+ (haptics, i18n helpers, date formatters)
- **Components:** 80%+ (UI components, forms)
- **API Routes:** 85%+ (business logic)
- **Overall:** 80%+

---

## 🎭 E2E Testing with Playwright

### Setup Playwright

```bash
npm init playwright@latest

# Install browsers
npx playwright install
```

**Create:** `playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
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
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Critical E2E Test Scenarios

**Create:** `e2e/weekly-order-flow.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Weekly Order Flow', () => {
  test('complete order from menu to payment', async ({ page }) => {
    // 1. Navigate to weekly menu
    await page.goto('/menu/weekly');
    await expect(page.locator('h1')).toContainText("This Week's Menu");

    // 2. View dishes for each day
    await page.click('button:has-text("Monday")');
    await expect(page.locator('.dish-card')).toHaveCount(3); // 3 dishes

    // 3. Select Package B
    await page.click('text=Package B');
    await page.click('text=Continue to Checkout');

    // 4. Fill delivery details
    await page.fill('input[name="delivery_address"]', '123 Main St, Los Angeles, CA 90012');
    await page.selectOption('select[name="delivery_window"]', '8 AM - 12 PM');
    await page.fill('textarea[name="delivery_instructions"]', 'Ring doorbell');

    // 5. Complete payment (test mode)
    await page.fill('input[name="card_number"]', '4242424242424242');
    await page.fill('input[name="card_expiry"]', '12/34');
    await page.fill('input[name="card_cvc"]', '123');

    // 6. Place order
    await page.click('button:has-text("Place Order")');

    // 7. Verify confirmation
    await expect(page.locator('h1')).toContainText('Order Confirmed');
    await expect(page.locator('text=Package B')).toBeVisible();
  });

  test('cannot order after deadline', async ({ page }) => {
    // Mock date to be past deadline
    await page.addInitScript(() => {
      const mockDate = new Date('2026-01-09T00:00:00'); // Thursday
      Date.now = () => mockDate.getTime();
    });

    await page.goto('/menu/weekly');

    // Should show deadline passed message
    await expect(page.locator('text=Orders closed')).toBeVisible();

    // Package selector should be disabled
    const packageButtons = page.locator('button:has-text("Select Package")');
    await expect(packageButtons.first()).toBeDisabled();
  });

  test('cannot order twice for same week', async ({ page }) => {
    // Login as user who already ordered
    await page.goto('/login');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign In")');

    await page.goto('/menu/weekly');
    await page.click('text=Package A');
    await page.click('text=Continue to Checkout');

    // Should show error
    await expect(page.locator('text=already have an order')).toBeVisible();
  });
});
```

**Create:** `e2e/mobile-navigation.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

  test('bottom nav works on mobile', async ({ page }) => {
    await page.goto('/menu');

    // Bottom nav should be visible
    const bottomNav = page.locator('nav[aria-label="Main navigation"]');
    await expect(bottomNav).toBeVisible();

    // Navigate to Track page
    await page.click('text=Track');
    await expect(page).toHaveURL(/\/track/);

    // Active state should update
    const trackButton = page.locator('a[aria-current="page"]');
    await expect(trackButton).toHaveText('Track');
  });

  test('bottom nav hides on scroll down', async ({ page }) => {
    await page.goto('/menu/weekly');

    const bottomNav = page.locator('nav[aria-label="Main navigation"]');

    // Initially visible
    await expect(bottomNav).toBeVisible();

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500); // Wait for animation

    // Should be hidden
    await expect(bottomNav).toHaveCSS('transform', /translateY\(100%\)/);
  });

  test('swipe to close modal', async ({ page }) => {
    await page.goto('/menu/weekly');

    // Open dish modal
    await page.click('.dish-card').first();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Simulate swipe down
    await page.touchscreen.tap(200, 100); // Start touch
    await page.mouse.move(200, 300); // Drag down
    await page.touchscreen.tap(200, 300); // End touch

    // Modal should close
    await expect(modal).not.toBeVisible();
  });
});
```

### Run E2E Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific test
npx playwright test e2e/weekly-order-flow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

---

## ✅ Manual Testing Checklists

### Weekly Menu System

**Admin Flow:**
- [ ] Create menu template
  - [ ] Add 21 dishes (7 days × 3 dishes)
  - [ ] Save template
  - [ ] Edit template
  - [ ] Deactivate template
- [ ] Generate weekly menu
  - [ ] Select template
  - [ ] Set week start date (Sunday)
  - [ ] Verify order deadline (Wednesday 11:59 PM)
  - [ ] Verify delivery date (Saturday)
  - [ ] Publish menu
- [ ] View order summary
  - [ ] Total orders per package
  - [ ] Revenue projection
  - [ ] Orders by delivery window

**Customer Flow:**
- [ ] View current week's menu
  - [ ] See all 7 days
  - [ ] Switch between days
  - [ ] View dish details
- [ ] Select package
  - [ ] View package comparison
  - [ ] See pricing
  - [ ] Select Package B (most popular)
- [ ] Complete checkout
  - [ ] Select delivery address
  - [ ] Choose delivery window
  - [ ] Add delivery instructions
  - [ ] Enter payment info
  - [ ] Place order
- [ ] Receive confirmation
  - [ ] Email confirmation
  - [ ] Order appears in history
  - [ ] Can track order

**Error Cases:**
- [ ] Try to order after deadline → Show error
- [ ] Try to order twice same week → Show error
- [ ] Payment fails → Show error, don't create order
- [ ] Invalid delivery address → Show validation error

---

### Mobile UX

**Navigation:**
- [ ] Bottom nav appears on mobile
- [ ] Bottom nav hides on scroll down
- [ ] Bottom nav shows on scroll up
- [ ] Active state highlights correct tab
- [ ] Bottom nav hidden on desktop

**Touch Optimizations:**
- [ ] All buttons ≥44px tap target
- [ ] Form inputs ≥48px
- [ ] Inputs don't zoom on focus (iOS)
- [ ] Haptic feedback on button taps
- [ ] Haptic on add to cart
- [ ] Haptic on package selection

**Swipeable Modals:**
- [ ] Swipe down to close
- [ ] Can't swipe up
- [ ] Backdrop darkens on swipe
- [ ] Modal closes if swiped >100px
- [ ] Modal returns if swiped <100px

**Pull-to-Refresh:**
- [ ] Pull down from top triggers refresh
- [ ] Spinner rotates during pull
- [ ] Haptic when threshold reached
- [ ] Refreshes content
- [ ] Doesn't trigger when not at top

**PWA:**
- [ ] Install prompt appears (after 30s)
- [ ] Can install to home screen
- [ ] App opens in standalone mode
- [ ] Icon appears on home screen
- [ ] Splash screen shows (iOS)

---

### Burmese Language (i18n)

**Language Switching:**
- [ ] Language switcher in header
- [ ] Switch to Burmese → All UI translates
- [ ] Switch to English → All UI translates
- [ ] URL updates (/my/menu)
- [ ] Language persists on refresh

**Burmese Font:**
- [ ] Noto Sans Myanmar loads
- [ ] Text is readable
- [ ] Line height appropriate (1.8)
- [ ] No layout breaking

**Translated Content:**
- [ ] Navigation labels
- [ ] Day names (တနင်္ဂနွေ, တနင်္လာ, etc.)
- [ ] Package descriptions
- [ ] Button text
- [ ] Error messages
- [ ] Email templates

**Database Content:**
- [ ] Dish names in Burmese (if available)
- [ ] Dish descriptions in Burmese
- [ ] Falls back to English if no Burmese

**Edge Cases:**
- [ ] Long Burmese text doesn't overflow
- [ ] Numbers render correctly
- [ ] Mixed Burmese/English text
- [ ] Right-to-left text (if applicable)

---

### Driver Dashboard

- [ ] View assigned deliveries
- [ ] See delivery details (address, window, instructions)
- [ ] Start route (Google Maps integration)
- [ ] Mark delivery as delivered
- [ ] Contact customer (phone)
- [ ] View delivery history
- [ ] Update status (out for delivery)

---

### Admin Dashboard

- [ ] View all orders
- [ ] Filter by status
- [ ] Filter by delivery date
- [ ] Assign driver to order
- [ ] View customer details
- [ ] Manage dishes (CRUD)
- [ ] View analytics
  - [ ] Revenue by week
  - [ ] Popular dishes
  - [ ] Customer retention

---

## ⚡ Performance Testing

### Lighthouse Audits

```bash
# Install Lighthouse CI
npm install -g @lhci/cli

# Run Lighthouse
lhci autorun --collect.url=http://localhost:3000/menu/weekly
```

**Performance Targets:**
- **Performance:** >90
- **Accessibility:** >95
- **Best Practices:** >90
- **SEO:** >90
- **PWA:** All checks pass

### Key Metrics:

- **Largest Contentful Paint (LCP):** <2.5s
- **First Input Delay (FID):** <100ms
- **Cumulative Layout Shift (CLS):** <0.1
- **Time to Interactive (TTI):** <3.5s

### Load Testing

```bash
# Install k6
brew install k6

# Run load test
k6 run load-test.js
```

**Create:** `load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // Ramp up to 20 users
    { duration: '1m', target: 50 },  // Stay at 50 users
    { duration: '30s', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
  },
};

export default function () {
  // Test weekly menu endpoint
  const res = http.get('https://your-app.vercel.app/api/menu/weekly/current');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Load Test Targets:**
- **Concurrent Users:** 100+
- **Response Time (p95):** <500ms
- **Error Rate:** <1%
- **Throughput:** 1000+ req/min

---

## 🔒 Security Testing

### RLS (Row-Level Security) Tests

**Create:** `e2e/security/rls.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('RLS Policies', () => {
  test('customers can only view their own orders', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Login as customer A
    await supabase.auth.signInWithPassword({
      email: 'customerA@example.com',
      password: 'password123',
    });

    // Try to fetch all orders
    const { data, error } = await supabase
      .from('weekly_orders')
      .select('*');

    // Should only see own orders
    expect(data?.every(order => order.customer_id === 'customerA-uuid')).toBe(true);
  });

  test('non-admins cannot create menu templates', async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Login as regular customer
    await supabase.auth.signInWithPassword({
      email: 'customer@example.com',
      password: 'password123',
    });

    // Try to create menu template
    const { data, error } = await supabase
      .from('menu_templates')
      .insert({ name: 'Hacker Template' });

    expect(error).toBeTruthy();
    expect(error?.message).toContain('permission denied');
  });
});
```

### API Security Checklist

- [ ] All endpoints validate auth token
- [ ] API routes use Zod for input validation
- [ ] SQL injection prevented (parameterized queries)
- [ ] XSS prevented (React auto-escaping)
- [ ] CSRF tokens on forms
- [ ] Rate limiting on API routes
- [ ] Stripe webhook signature verified
- [ ] No sensitive data in client logs
- [ ] Environment variables secure

### Penetration Testing Scenarios

- [ ] Try to access admin pages as customer
- [ ] Try to modify someone else's order
- [ ] Try SQL injection in search fields
- [ ] Try XSS in delivery instructions
- [ ] Try to bypass payment
- [ ] Try to order after deadline (client-side bypass)

---

## ♿ Accessibility Testing

### Automated Tools

```bash
# Install axe-core
npm install --save-dev @axe-core/playwright

# Run accessibility tests
npx playwright test a11y.spec.ts
```

**Create:** `e2e/a11y.spec.ts`

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('weekly menu page has no a11y violations', async ({ page }) => {
    await page.goto('/menu/weekly');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
```

### Manual A11y Checklist

**Keyboard Navigation:**
- [ ] Can tab through all interactive elements
- [ ] Tab order is logical
- [ ] Focus visible on all elements
- [ ] Can submit forms with Enter
- [ ] Can close modals with Escape

**Screen Reader:**
- [ ] All images have alt text
- [ ] Form inputs have labels
- [ ] ARIA labels on icon buttons
- [ ] Page landmarks (nav, main, footer)
- [ ] Live regions for dynamic content

**Color Contrast:**
- [ ] Text contrast ≥4.5:1
- [ ] Large text ≥3:1
- [ ] UI elements ≥3:1
- [ ] Works in high contrast mode

**For Elderly Users:**
- [ ] Large tap targets (≥44px)
- [ ] Large text mode available
- [ ] High contrast option
- [ ] Simple, clear labels
- [ ] No critical info color-only

---

## 📱 Mobile Testing

### Real Device Testing

**Required Devices:**
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro (notch)
- [ ] Samsung Galaxy S23 (Android)
- [ ] iPad (tablet)

**Test on Each Device:**
- [ ] Bottom nav works
- [ ] Forms don't zoom on focus
- [ ] Images load properly
- [ ] Haptic feedback works
- [ ] PWA installable
- [ ] Offline mode (if applicable)
- [ ] Touch gestures work
- [ ] No horizontal scroll

### Browser Testing

- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Mobile

### Network Conditions

```bash
# Simulate slow 3G
npx playwright test --global-timeout=60000 --browser-context-options='{"offline":false,"downloadThroughput":50000,"uploadThroughput":50000,"latency":2000}'
```

- [ ] Fast 4G
- [ ] Slow 3G
- [ ] Offline

---

## 🌐 Burmese Language Testing

### Native Speaker Testing

**Recruit Testers:**
- [ ] Elderly Burmese speaker (60+)
- [ ] Middle-aged professional (40-50)
- [ ] Student (18-25)

**Test Tasks:**
1. Switch to Burmese language
2. Browse weekly menu
3. Read dish descriptions
4. Select package
5. Complete checkout
6. Provide feedback on translations

**Questions to Ask:**
- Is the translation natural?
- Any confusing terms?
- Is font readable?
- Any cultural issues?
- Would you recommend to others?

### Translation Quality Checklist

- [ ] No machine translation artifacts
- [ ] Culturally appropriate terms
- [ ] Consistent terminology
- [ ] Proper honorifics (if applicable)
- [ ] No grammar errors
- [ ] Numbers formatted correctly

---

## 👥 User Acceptance Testing (UAT)

### Beta Testing Program

**Recruit 10-15 Beta Testers:**
- 3-4 elderly users
- 4-5 families
- 3-4 students

**UAT Process:**

1. **Week 1:** Onboarding
   - Send welcome email
   - Schedule intro call
   - Provide test account

2. **Week 2-3:** Testing
   - Place test orders
   - Provide feedback
   - Report bugs

3. **Week 4:** Feedback Collection
   - Exit survey
   - Interview top users
   - Gather testimonials

**UAT Checklist:**
- [ ] Can create account
- [ ] Can browse menu
- [ ] Can select package
- [ ] Can checkout
- [ ] Receives confirmation email
- [ ] Can track order
- [ ] Can contact support
- [ ] Overall satisfied (4/5+)

---

## 🚀 Production Smoke Tests

**After Each Deployment:**

```bash
# Run smoke tests
npm run test:smoke
```

**Create:** `e2e/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('can view weekly menu', async ({ page }) => {
    await page.goto('/menu/weekly');
    await expect(page.locator('h1')).toContainText("This Week's Menu");
  });

  test('can login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/\/account/);
  });

  test('API health check', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('database connection', async ({ request }) => {
    const response = await request.get('/api/menu/packages');
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.packages).toHaveLength(3);
  });
});
```

**Smoke Test Checklist:**
- [ ] Homepage loads
- [ ] Menu page loads
- [ ] Auth works
- [ ] API responds
- [ ] Database connected
- [ ] Stripe test payment works
- [ ] Email sends (test mode)

---

## 📊 Test Metrics & Reporting

### Test Dashboard

Track these metrics:
- **Test Pass Rate:** >95%
- **Code Coverage:** >80%
- **E2E Pass Rate:** >90%
- **Flaky Test Rate:** <5%
- **Test Execution Time:** <10min

### CI/CD Integration

**Create:** `.github/workflows/test.yml`

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload coverage
        uses: codecov/codecov-action@v3

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎯 Pre-Launch Checklist

### One Week Before Launch:

- [ ] All critical bugs fixed
- [ ] All tests passing
- [ ] Lighthouse scores >90
- [ ] UAT completed with 8/10 satisfaction
- [ ] Staging tested by 5+ people
- [ ] Database backups configured
- [ ] Monitoring set up (Sentry, Vercel Analytics)
- [ ] Support email configured
- [ ] Legal pages ready (Terms, Privacy)

### Launch Day:

- [ ] Run production smoke tests
- [ ] Monitor error rates
- [ ] Watch Stripe dashboard
- [ ] Check email deliverability
- [ ] Test customer support flow
- [ ] Monitor performance metrics

### Post-Launch (Week 1):

- [ ] Daily smoke tests
- [ ] Monitor user feedback
- [ ] Track conversion funnel
- [ ] Fix high-priority bugs
- [ ] Collect testimonials
- [ ] Iterate based on feedback

---

**Quality is non-negotiable! Test thoroughly before launch! ✅**
