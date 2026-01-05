# 🌐 PR #26: Burmese Language Support (i18n) - Step-by-Step Implementation

**For:** Codex
**Priority:** P0 (Critical for LA Burmese Community)
**Estimated Time:** 8-10 hours
**Target Users:** Burmese speakers in LA (especially elderly, families, students)
**Branch:** `codex/burmese-language-support`

---

## 🎯 What We're Building

Make the entire app accessible in Burmese (Myanmar) language:

- **Language switcher** in header (English ⇄ မြန်မာ)
- **All UI text** translated to Burmese
- **Database content** bilingual (dish names, descriptions, etc.)
- **Email templates** in both languages
- **Proper font rendering** for Burmese script
- **Auto-detect** user's language preference

**Why this matters:**
- Many elderly Burmese speakers prefer their native language
- Increases trust and comfort for the community
- Shows cultural respect and authenticity
- Expands market reach to non-English speakers

---

## 📋 Implementation Strategy

We'll use **next-intl** (the best i18n library for Next.js App Router):

1. Install and configure next-intl
2. Create translation files (English + Burmese)
3. Update all UI components to use translations
4. Add database columns for Burmese content
5. Create language switcher component
6. Set up Burmese font (Noto Sans Myanmar)
7. Test with native Burmese speakers

---

## 🚀 Step-by-Step Implementation

### Step 1: Install next-intl (30 minutes)

#### 1.1 Install Package

```bash
npm install next-intl
```

#### 1.2 Create i18n Configuration

**Create:** `src/i18n.ts`

```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Supported locales
export const locales = ['en', 'my'] as const; // 'my' = Myanmar/Burmese
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = {
  en: 'English',
  my: 'မြန်မာ',
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

#### 1.3 Update Next.js Config

**Edit:** `next.config.js`

```javascript
const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... your existing config
};

module.exports = withNextIntl(nextConfig);
```

#### 1.4 Create Middleware for Locale Detection

**Create:** `src/middleware.ts`

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Always use a locale prefix (e.g., /en/menu, /my/menu)
  localePrefix: 'as-needed', // Only add prefix for non-default locale
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next (Next.js internals)
  // - Static files
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

#### 1.5 Update Root Layout

**Edit:** `src/app/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n';

type Props = {
  children: React.ReactNode;
  params: { locale: string };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params: { locale }
}: Props) {
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} className={locale === 'my' ? 'font-myanmar' : ''}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

### Step 2: Create Translation Files (3 hours)

#### 2.1 English Translations

**Create:** `messages/en.json`

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "search": "Search",
    "filter": "Filter",
    "viewAll": "View All"
  },

  "nav": {
    "menu": "Menu",
    "schedule": "Schedule",
    "track": "Track",
    "account": "Account",
    "admin": "Admin",
    "driver": "Driver Dashboard"
  },

  "days": {
    "sunday": "Sunday",
    "monday": "Monday",
    "tuesday": "Tuesday",
    "wednesday": "Wednesday",
    "thursday": "Thursday",
    "friday": "Friday",
    "saturday": "Saturday"
  },

  "weeklyMenu": {
    "title": "This Week's Menu",
    "noMenuAvailable": "No menu available",
    "noMenuDescription": "This week's menu hasn't been published yet. Check back soon!",
    "orderBy": "Order by Wednesday 11:59 PM",
    "hoursRemaining": "{hours} hours remaining",
    "ordersClosed": "Orders closed",
    "deliveryDate": "Delivery: {date}",
    "dishNumber": "Dish {number}",
    "soldOut": "Sold Out",
    "portionsRemaining": "{count} portions remaining"
  },

  "packages": {
    "choosePackage": "Choose Your Package",
    "chooseDescription": "Select how many dishes you'd like each day",
    "packageA": "Package A",
    "packageB": "Package B",
    "packageC": "Package C",
    "dishesPerDay": "{count} dish per day | {count} dishes per day",
    "totalDishes": "{count} total dishes",
    "perWeek": "/week",
    "saturdayDelivery": "Saturday delivery",
    "freshAuthentic": "Fresh & authentic",
    "mostPopular": "Most Popular",
    "bestValue": "Best Value",
    "selected": "Selected",
    "selectPackage": "Select Package",
    "continueToCheckout": "Continue to Checkout"
  },

  "checkout": {
    "title": "Checkout",
    "orderSummary": "Order Summary",
    "package": "Package",
    "weekOf": "Week of {date}",
    "deliveryAddress": "Delivery Address",
    "selectAddress": "Select address",
    "addNewAddress": "Add new address",
    "deliveryWindow": "Delivery Window",
    "selectWindow": "Select preferred time",
    "morning": "8 AM - 12 PM",
    "afternoon": "12 PM - 4 PM",
    "evening": "4 PM - 8 PM",
    "deliveryInstructions": "Delivery Instructions",
    "instructionsPlaceholder": "Gate code, parking info, etc.",
    "paymentMethod": "Payment Method",
    "total": "Total",
    "placeOrder": "Place Order",
    "processing": "Processing..."
  },

  "auth": {
    "signIn": "Sign In",
    "signOut": "Sign Out",
    "signUp": "Sign Up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "noAccount": "Don't have an account?",
    "haveAccount": "Already have an account?",
    "emailPlaceholder": "you@example.com",
    "passwordPlaceholder": "Enter your password",
    "signInWithEmail": "Sign in with email",
    "signUpWithEmail": "Sign up with email"
  },

  "account": {
    "myAccount": "My Account",
    "profile": "Profile",
    "orders": "Orders",
    "addresses": "Addresses",
    "settings": "Settings",
    "orderHistory": "Order History",
    "noOrders": "No orders yet",
    "noOrdersDescription": "When you place an order, it will appear here",
    "viewOrder": "View Order",
    "orderStatus": {
      "pending": "Pending",
      "confirmed": "Confirmed",
      "preparing": "Preparing",
      "outForDelivery": "Out for Delivery",
      "delivered": "Delivered",
      "cancelled": "Cancelled"
    }
  },

  "tracking": {
    "title": "Track Your Delivery",
    "eta": "Estimated Arrival",
    "driverName": "Driver",
    "driverPhone": "Contact Driver",
    "orderNumber": "Order #{number}",
    "noActiveDelivery": "No active delivery",
    "noActiveDescription": "You don't have any deliveries in progress right now"
  },

  "admin": {
    "dashboard": "Admin Dashboard",
    "menus": "Menus",
    "templates": "Menu Templates",
    "createTemplate": "Create Template",
    "generateMenu": "Generate Weekly Menu",
    "orders": "Orders",
    "customers": "Customers",
    "drivers": "Drivers",
    "dishes": "Dishes",
    "analytics": "Analytics",
    "settings": "Settings"
  },

  "driver": {
    "dashboard": "Driver Dashboard",
    "myDeliveries": "My Deliveries",
    "upcomingDeliveries": "Upcoming Deliveries",
    "completedDeliveries": "Completed Deliveries",
    "startRoute": "Start Route",
    "markDelivered": "Mark as Delivered",
    "contactCustomer": "Contact Customer",
    "deliveryAddress": "Delivery Address",
    "deliveryInstructions": "Delivery Instructions",
    "noDeliveries": "No deliveries assigned",
    "noDeliveriesDescription": "Check back later for delivery assignments"
  },

  "email": {
    "orderConfirmation": {
      "subject": "Order Confirmed - Week of {date}",
      "greeting": "Hi {name},",
      "confirmMessage": "Your order has been confirmed!",
      "packageSelected": "Package Selected",
      "deliveryDate": "Delivery Date",
      "deliveryWindow": "Delivery Window",
      "total": "Total Paid",
      "viewOrder": "View Order Details",
      "questions": "Questions? Contact us at support@mandalaymorningstar.com"
    },
    "deliveryReminder": {
      "subject": "Delivery Tomorrow - {package}",
      "greeting": "Hi {name},",
      "reminderMessage": "Your delicious Burmese food will be delivered tomorrow!",
      "prepareFor": "Please prepare for delivery",
      "trackDelivery": "Track Your Delivery"
    }
  },

  "errors": {
    "unauthorized": "You must be signed in to access this page",
    "forbidden": "You don't have permission to access this page",
    "notFound": "Page not found",
    "serverError": "Something went wrong. Please try again later.",
    "networkError": "Network error. Please check your connection.",
    "validationError": "Please check your input and try again",
    "orderDeadlinePassed": "Sorry, the order deadline has passed",
    "alreadyOrdered": "You already have an order for this week",
    "soldOut": "This dish is sold out"
  }
}
```

#### 2.2 Burmese Translations

**Create:** `messages/my.json`

```json
{
  "common": {
    "loading": "ခဏစောင့်ပါ...",
    "error": "တစ်ခုခု မှားယွင်းနေပါသည်",
    "save": "သိမ်းရန်",
    "cancel": "ပယ်ဖျက်ရန်",
    "delete": "ဖျက်ရန်",
    "edit": "ပြင်ဆင်ရန်",
    "close": "ပိတ်ရန်",
    "back": "နောက်သို့",
    "next": "ရှေ့သို့",
    "submit": "တင်သွင်းရန်",
    "search": "ရှာဖွေရန်",
    "filter": "စစ်ထုတ်ရန်",
    "viewAll": "အားလုံးကြည့်ရန်"
  },

  "nav": {
    "menu": "မီနူး",
    "schedule": "အချိန်စာရင်း",
    "track": "ခြေရာခံ",
    "account": "အကောင့်",
    "admin": "စီမံခန့်ခွဲမှု",
    "driver": "ယာဉ်မောင်းစီမံခန့်ခွဲမှု"
  },

  "days": {
    "sunday": "တနင်္ဂနွေ",
    "monday": "တနင်္လာ",
    "tuesday": "အင်္ဂါ",
    "wednesday": "ဗုဒ္ဓဟူး",
    "thursday": "ကြာသပတေး",
    "friday": "သောကြာ",
    "saturday": "စနေ"
  },

  "weeklyMenu": {
    "title": "ဒီအပတ်ရဲ့ မီနူး",
    "noMenuAvailable": "မီနူးမရှိသေးပါ",
    "noMenuDescription": "ဒီအပတ်ရဲ့ မီနူးကို မထုတ်ဝေရသေးပါ။ နောက်မှ ပြန်စစ်ကြည့်ပါ။",
    "orderBy": "ဗုဒ္ဓဟူးနေ့ ည ၁၁:၅၉ မတိုင်မီ မှာယူပါ",
    "hoursRemaining": "{hours} နာရီ ကျန်သည်",
    "ordersClosed": "အော်ဒါပိတ်ပြီ",
    "deliveryDate": "ပို့ဆောင်မည့်နေ့: {date}",
    "dishNumber": "ဟင်း {number}",
    "soldOut": "ကုန်သွားပြီ",
    "portionsRemaining": "{count} ပိုင်း ကျန်သည်"
  },

  "packages": {
    "choosePackage": "သင့်အစီအစဉ်ကို ရွေးချယ်ပါ",
    "chooseDescription": "တစ်ရက်လျှင် ဘယ်နှစ်မျိုး စားချင်သည်ကို ရွေးပါ",
    "packageA": "အစီအစဉ် A",
    "packageB": "အစီအစဉ် B",
    "packageC": "အစီအစဉ် C",
    "dishesPerDay": "တစ်ရက်လျှင် ဟင်း {count} မျိုး",
    "totalDishes": "စုစုပေါင်း ဟင်း {count} မျိုး",
    "perWeek": "/အပတ်",
    "saturdayDelivery": "စနေနေ့ ပို့ဆောင်မည်",
    "freshAuthentic": "လတ်ဆတ်ပြီး စစ်မှန်သော",
    "mostPopular": "လူကြိုက်အများဆုံး",
    "bestValue": "အကောင်းဆုံး တန်ဖိုး",
    "selected": "ရွေးထားပြီး",
    "selectPackage": "အစီအစဉ် ရွေးပါ",
    "continueToCheckout": "ငွေချေရန် ဆက်သွားပါ"
  },

  "checkout": {
    "title": "ငွေချေမည်",
    "orderSummary": "အော်ဒါအကျဉ်း",
    "package": "အစီအစဉ်",
    "weekOf": "{date} အပတ်",
    "deliveryAddress": "ပို့ဆောင်မည့်လိပ်စာ",
    "selectAddress": "လိပ်စာ ရွေးပါ",
    "addNewAddress": "လိပ်စာအသစ် ထည့်ပါ",
    "deliveryWindow": "ပို့ဆောင်မည့်အချိန်",
    "selectWindow": "အချိန်ကို ရွေးပါ",
    "morning": "နံနက် ၈:၀၀ - ၁၂:၀၀",
    "afternoon": "မွန်းလွဲ ၁၂:၀၀ - ၄:၀၀",
    "evening": "ညနေ ၄:၀၀ - ၈:၀၀",
    "deliveryInstructions": "ပို့ဆောင်ရေး ညွှန်ကြားချက်များ",
    "instructionsPlaceholder": "ဂိတ်ကုဒ်၊ ကားရပ်နားရာ စသည်",
    "paymentMethod": "ငွေပေးချေမှု နည်းလမ်း",
    "total": "စုစုပေါင်း",
    "placeOrder": "အော်ဒါမှာမည်",
    "processing": "လုပ်ဆောင်နေသည်..."
  },

  "auth": {
    "signIn": "ဝင်ရောက်ရန်",
    "signOut": "ထွက်ရန်",
    "signUp": "အကောင့်ဖွင့်ရန်",
    "email": "အီးမေးလ်",
    "password": "စကားဝှက်",
    "forgotPassword": "စကားဝှက် မေ့သွားပြီလား?",
    "noAccount": "အကောင့်မရှိသေးဘူးလား?",
    "haveAccount": "အကောင့်ရှိပြီးသားလား?",
    "emailPlaceholder": "သင့်အီးမေးလ်",
    "passwordPlaceholder": "စကားဝှက် ရိုက်ထည့်ပါ",
    "signInWithEmail": "အီးမေးလ်ဖြင့် ဝင်ရောက်ပါ",
    "signUpWithEmail": "အီးမေးလ်ဖြင့် အကောင့်ဖွင့်ပါ"
  },

  "account": {
    "myAccount": "ကျွန်ုပ်၏ အကောင့်",
    "profile": "ကိုယ်ရေးအချက်အလက်",
    "orders": "အော်ဒါများ",
    "addresses": "လိပ်စာများ",
    "settings": "ဆက်တင်များ",
    "orderHistory": "အော်ဒါမှတ်တမ်း",
    "noOrders": "အော်ဒါ မရှိသေးပါ",
    "noOrdersDescription": "အော်ဒါမှာလျှင် ဤနေရာတွင် ပေါ်လာပါမည်",
    "viewOrder": "အော်ဒါကြည့်ရန်",
    "orderStatus": {
      "pending": "စောင့်ဆိုင်းဆဲ",
      "confirmed": "အတည်ပြုပြီး",
      "preparing": "ပြင်ဆင်နေသည်",
      "outForDelivery": "ပို့ဆောင်နေသည်",
      "delivered": "ပို့ဆောင်ပြီး",
      "cancelled": "ပယ်ဖျက်ပြီး"
    }
  },

  "tracking": {
    "title": "ပို့ဆောင်မှုကို ခြေရာခံပါ",
    "eta": "ရောက်ရှိမည့် အချိန်ခန့်မှန်း",
    "driverName": "ယာဉ်မောင်း",
    "driverPhone": "ယာဉ်မောင်းကို ဆက်သွယ်ရန်",
    "orderNumber": "အော်ဒါနံပါတ် #{number}",
    "noActiveDelivery": "ပို့ဆောင်နေသော အော်ဒါ မရှိပါ",
    "noActiveDescription": "လောလောဆယ် ပို့ဆောင်နေသော အော်ဒါ မရှိပါ"
  },

  "admin": {
    "dashboard": "စီမံခန့်ခွဲမှု",
    "menus": "မီနူးများ",
    "templates": "မီနူး ပုံစံများ",
    "createTemplate": "ပုံစံအသစ် ဖန်တီးရန်",
    "generateMenu": "အပတ်စဉ် မီနူး ဖန်တီးရန်",
    "orders": "အော်ဒါများ",
    "customers": "ဖောက်သည်များ",
    "drivers": "ယာဉ်မောင်းများ",
    "dishes": "ဟင်းလျာများ",
    "analytics": "ခွဲခြမ်းစိတ်ဖြာမှု",
    "settings": "ဆက်တင်များ"
  },

  "driver": {
    "dashboard": "ယာဉ်မောင်း စီမံခန့်ခွဲမှု",
    "myDeliveries": "ကျွန်ုပ်၏ ပို့ဆောင်မှုများ",
    "upcomingDeliveries": "လာမည့် ပို့ဆောင်မှုများ",
    "completedDeliveries": "ပြီးသော ပို့ဆောင်မှုများ",
    "startRoute": "လမ်းကြောင်း စတင်ရန်",
    "markDelivered": "ပို့ဆောင်ပြီး ဟု မှတ်ရန်",
    "contactCustomer": "ဖောက်သည်ကို ဆက်သွယ်ရန်",
    "deliveryAddress": "ပို့ဆောင်မည့်လိပ်စာ",
    "deliveryInstructions": "ပို့ဆောင်ရေး ညွှန်ကြားချက်များ",
    "noDeliveries": "ပို့ဆောင်ရန် မရှိပါ",
    "noDeliveriesDescription": "ပို့ဆောင်ရန် တာဝန်ပေးခြင်းကို စောင့်ပါ"
  },

  "email": {
    "orderConfirmation": {
      "subject": "အော်ဒါအတည်ပြုပြီး - {date} အပတ်",
      "greeting": "မင်္ဂလာပါ {name}",
      "confirmMessage": "သင့်အော်ဒါကို အတည်ပြုပြီးပါပြီ!",
      "packageSelected": "ရွေးချယ်ထားသော အစီအစဉ်",
      "deliveryDate": "ပို့ဆောင်မည့်နေ့",
      "deliveryWindow": "ပို့ဆောင်မည့်အချိန်",
      "total": "စုစုပေါင်း ပေးချေပြီး",
      "viewOrder": "အော်ဒါအသေးစိတ် ကြည့်ရန်",
      "questions": "မေးခွန်းရှိပါက support@mandalaymorningstar.com သို့ ဆက်သွယ်ပါ"
    },
    "deliveryReminder": {
      "subject": "မနက်ဖြန် ပို့ဆောင်မည် - {package}",
      "greeting": "မင်္ဂလာပါ {name}",
      "reminderMessage": "သင့်အရသာရှိသော မြန်မာ့အစားအစာကို မနက်ဖြန် ပို့ဆောင်ပေးပါမည်!",
      "prepareFor": "ပို့ဆောင်မှုအတွက် ပြင်ဆင်ထားပါ",
      "trackDelivery": "ပို့ဆောင်မှုကို ခြေရာခံပါ"
    }
  },

  "errors": {
    "unauthorized": "ဒီစာမျက်နှာကို ကြည့်ရှုရန် အကောင့်ဝင်ရန် လိုအပ်ပါသည်",
    "forbidden": "သင့်တွင် ဤစာမျက်နှာကို ကြည့်ရှုခွင့် မရှိပါ",
    "notFound": "စာမျက်နှာ မတွေ့ပါ",
    "serverError": "တစ်ခုခု မှားယွင်းသွားပါသည်။ နောက်မှ ပြန်လည်ကြိုးစားပါ။",
    "networkError": "ကွန်ရက် အမှား။ သင့်ချိတ်ဆက်မှုကို စစ်ဆေးပါ။",
    "validationError": "သင့်ရိုက်ထည့်မှုကို စစ်ဆေးပြီး ပြန်လည်ကြိုးစားပါ",
    "orderDeadlinePassed": "စိတ်မကောင်းပါဘူး၊ အော်ဒါမှာရန် သတ်မှတ်ချိန် ကျော်လွန်သွားပြီ",
    "alreadyOrdered": "သင့်တွင် ဒီအပတ်အတွက် အော်ဒါ ရှိပြီးသားဖြစ်သည်",
    "soldOut": "ဒီဟင်းလျာ ကုန်သွားပြီ"
  }
}
```

---

### Step 3: Update Components to Use Translations (2 hours)

#### 3.1 Update Bottom Navigation

**Edit:** `src/components/navigation/mobile-bottom-nav.tsx`

```typescript
"use client";

import { useTranslations } from 'next-intl';
// ... other imports

const NAV_ITEMS = [
  {
    href: "/menu",
    icon: UtensilsCrossed,
    translationKey: "nav.menu",
  },
  {
    href: "/schedule",
    icon: Calendar,
    translationKey: "nav.schedule",
  },
  {
    href: "/track",
    icon: MapPin,
    translationKey: "nav.track",
  },
  {
    href: "/account",
    icon: User,
    translationKey: "nav.account",
  },
];

export function MobileBottomNav() {
  const t = useTranslations();
  // ... rest of component

  return (
    <nav>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href}>
          <Icon />
          <span>{t(item.translationKey)}</span>
        </Link>
      ))}
    </nav>
  );
}
```

#### 3.2 Update Weekly Menu View

**Edit:** `src/components/menu/weekly-menu-view.tsx`

```typescript
"use client";

import { useTranslations } from 'next-intl';

export function WeeklyMenuView() {
  const t = useTranslations('weeklyMenu');
  const tCommon = useTranslations('common');

  // ... component logic

  if (loading) {
    return <div>{tCommon('loading')}</div>;
  }

  if (!menu) {
    return (
      <div>
        <h2>{t('noMenuAvailable')}</h2>
        <p>{t('noMenuDescription')}</p>
      </div>
    );
  }

  return (
    <div>
      <h1>{t('title')}</h1>
      {/* Use t() for all text */}
      <p>{t('orderBy')}</p>
      <p>{t('hoursRemaining', { hours: hoursRemaining })}</p>
    </div>
  );
}
```

#### 3.3 Update Package Selector

**Edit:** `src/components/menu/package-selector.tsx`

```typescript
"use client";

import { useTranslations } from 'next-intl';

export function PackageSelector({ weeklyMenuId }: PackageSelectorProps) {
  const t = useTranslations('packages');

  return (
    <div>
      <h2>{t('choosePackage')}</h2>
      <p>{t('chooseDescription')}</p>

      {packages.map((pkg) => (
        <Card key={pkg.id}>
          <h3>{pkg.name}</h3>
          <span>${(pkg.price_cents / 100).toFixed(0)}{t('perWeek')}</span>
          <p>{pkg.description}</p>
          <Button>
            {isSelected ? t('selected') : t('selectPackage')}
          </Button>
        </Card>
      ))}

      <Button>{t('continueToCheckout')}</Button>
    </div>
  );
}
```

---

### Step 4: Language Switcher Component (1 hour)

#### 4.1 Create Language Switcher

**Create:** `src/components/language-switcher.tsx`

```typescript
"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: Locale) => {
    // Remove current locale from pathname if present
    const pathnameWithoutLocale = pathname.replace(`/${locale}`, '');

    // Add new locale (if not default 'en')
    const newPath = newLocale === 'en'
      ? pathnameWithoutLocale || '/'
      : `/${newLocale}${pathnameWithoutLocale || '/'}`;

    router.push(newPath);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{localeNames[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchLocale(loc)}
            className={locale === loc ? 'bg-slate-100 dark:bg-slate-800' : ''}
          >
            {localeNames[loc]}
            {locale === loc && (
              <span className="ml-2 text-xs text-[#D4A574]">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 4.2 Add to Header

**Edit:** `src/components/header.tsx`

```typescript
import { LanguageSwitcher } from './language-switcher';

export function Header() {
  return (
    <header>
      {/* ... existing header content ... */}
      <LanguageSwitcher />
    </header>
  );
}
```

---

### Step 5: Burmese Font Setup (1 hour)

#### 5.1 Add Noto Sans Myanmar Font

**Edit:** `src/app/layout.tsx`

```typescript
import { Noto_Sans, Noto_Sans_Myanmar } from 'next/font/google';

const notoSans = Noto_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
});

const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ['myanmar'],
  variable: '--font-myanmar',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children, params: { locale } }: Props) {
  return (
    <html
      lang={locale}
      className={`${notoSans.variable} ${notoSansMyanmar.variable}`}
    >
      <body className={locale === 'my' ? 'font-myanmar' : 'font-sans'}>
        {children}
      </body>
    </html>
  );
}
```

#### 5.2 Update Tailwind Config

**Edit:** `tailwind.config.ts`

```typescript
export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        myanmar: ['var(--font-myanmar)', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```

#### 5.3 Add Burmese-Specific Styles

**Edit:** `src/app/globals.css`

```css
/* Burmese Font Optimizations */
.font-myanmar {
  font-family: var(--font-myanmar), system-ui, sans-serif;
  /* Burmese text needs more line height */
  line-height: 1.8;
  letter-spacing: 0.01em;
}

/* Increase font size for Burmese for better readability */
[lang="my"] {
  font-size: 16px;
}

[lang="my"] button,
[lang="my"] input,
[lang="my"] select,
[lang="my"] textarea {
  font-size: 17px;
}

[lang="my"] h1 { font-size: 2.5rem; }
[lang="my"] h2 { font-size: 2rem; }
[lang="my"] h3 { font-size: 1.75rem; }

/* Better Burmese number rendering */
[lang="my"] .tabular-nums {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum";
}
```

---

### Step 6: Database Bilingual Content (1.5 hours)

#### 6.1 Add Burmese Columns Migration

**Create:** `supabase/migrations/20260104000002_add_burmese_columns.sql`

```sql
-- Add Burmese columns to dishes table
alter table dishes
  add column if not exists name_my text,
  add column if not exists description_my text;

-- Add Burmese columns to categories table (if exists)
alter table categories
  add column if not exists name_my text,
  add column if not exists description_my text;

-- Add Burmese columns to menu_templates (already have from PR #25)
-- (no changes needed)

-- Add Burmese columns to meal_packages (already have from PR #25)
-- (no changes needed)

-- Create helper function to get dish name by locale
create or replace function get_dish_name(dish_record dishes, preferred_locale text)
returns text as $$
begin
  if preferred_locale = 'my' and dish_record.name_my is not null then
    return dish_record.name_my;
  else
    return dish_record.name;
  end if;
end;
$$ language plpgsql immutable;

-- Create helper function to get description by locale
create or replace function get_dish_description(dish_record dishes, preferred_locale text)
returns text as $$
begin
  if preferred_locale = 'my' and dish_record.description_my is not null then
    return dish_record.description_my;
  else
    return dish_record.description;
  end if;
end;
$$ language plpgsql immutable;
```

#### 6.2 Update Dish Type

**Edit:** `src/types/index.ts`

```typescript
export interface Dish {
  id: string;
  name: string;
  name_my?: string; // Burmese name
  description?: string;
  description_my?: string; // Burmese description
  // ... other fields
}
```

#### 6.3 Helper Function for Localized Content

**Create:** `src/lib/i18n-helpers.ts`

```typescript
import type { Locale } from '@/i18n';

export function getLocalizedField<T>(
  item: T,
  fieldName: keyof T,
  locale: Locale
): string {
  if (locale === 'my') {
    const burmeseField = `${String(fieldName)}_my` as keyof T;
    if (item[burmeseField]) {
      return item[burmeseField] as string;
    }
  }
  return item[fieldName] as string;
}

// Usage example:
// const dishName = getLocalizedField(dish, 'name', locale);
// Returns dish.name_my if locale is 'my', otherwise dish.name
```

---

### Step 7: Email Templates in Burmese (1 hour)

#### 7.1 Create Bilingual Email Component

**Create:** `src/emails/order-confirmation.tsx`

```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

type OrderConfirmationEmailProps = {
  locale: 'en' | 'my';
  customerName: string;
  packageName: string;
  deliveryDate: string;
  totalAmount: string;
};

const translations = {
  en: {
    subject: 'Order Confirmed',
    greeting: (name: string) => `Hi ${name},`,
    confirmMessage: 'Your order has been confirmed!',
    packageSelected: 'Package Selected',
    deliveryDate: 'Delivery Date',
    total: 'Total Paid',
    thanks: 'Thank you for your order!',
  },
  my: {
    subject: 'အော်ဒါအတည်ပြုပြီး',
    greeting: (name: string) => `မင်္ဂလာပါ ${name}`,
    confirmMessage: 'သင့်အော်ဒါကို အတည်ပြုပြီးပါပြီ!',
    packageSelected: 'ရွေးချယ်ထားသော အစီအစဉ်',
    deliveryDate: 'ပို့ဆောင်မည့်နေ့',
    total: 'စုစုပေါင်း ပေးချေပြီး',
    thanks: 'သင့်အော်ဒါအတွက် ကျေးဇူးတင်ပါသည်!',
  },
};

export default function OrderConfirmationEmail({
  locale = 'en',
  customerName,
  packageName,
  deliveryDate,
  totalAmount,
}: OrderConfirmationEmailProps) {
  const t = translations[locale];

  return (
    <Html lang={locale}>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={{ fontFamily: locale === 'my' ? 'Noto Sans Myanmar' : 'system-ui' }}>
        <Container>
          <Heading>{t.confirmMessage}</Heading>
          <Text>{t.greeting(customerName)}</Text>

          <Text>
            <strong>{t.packageSelected}:</strong> {packageName}
          </Text>
          <Text>
            <strong>{t.deliveryDate}:</strong> {deliveryDate}
          </Text>
          <Text>
            <strong>{t.total}:</strong> {totalAmount}
          </Text>

          <Text>{t.thanks}</Text>
        </Container>
      </Body>
    </Html>
  );
}
```

#### 7.2 Send Email with Locale Detection

**Create:** `src/lib/email.ts`

```typescript
import { Resend } from 'resend';
import OrderConfirmationEmail from '@/emails/order-confirmation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderConfirmation(
  customerEmail: string,
  customerName: string,
  locale: 'en' | 'my',
  orderDetails: {
    packageName: string;
    deliveryDate: string;
    totalAmount: string;
  }
) {
  const subject = locale === 'my' ? 'အော်ဒါအတည်ပြုပြီး' : 'Order Confirmed';

  await resend.emails.send({
    from: 'Mandalay Morning Star <orders@mandalaymorningstar.com>',
    to: customerEmail,
    subject,
    react: OrderConfirmationEmail({
      locale,
      customerName,
      ...orderDetails,
    }),
  });
}
```

---

## 🧪 Testing Checklist

### Functionality Testing:
- [ ] Language switcher changes language
- [ ] All UI text translates correctly
- [ ] Burmese font renders properly
- [ ] No missing translation keys (check console)
- [ ] URLs work with both locales (/en/menu, /my/menu)
- [ ] Database content shows Burmese when available

### Visual Testing:
- [ ] Burmese text readable at all sizes
- [ ] Line height appropriate for Burmese
- [ ] No layout breaking with longer Burmese text
- [ ] Buttons fit Burmese text
- [ ] Forms handle Burmese input

### Browser Testing:
- [ ] Chrome (desktop & mobile)
- [ ] Safari (iOS)
- [ ] Firefox
- [ ] Edge

### Native Speaker Testing:
- [ ] Have elderly Burmese speaker test
- [ ] Check natural language flow
- [ ] Verify cultural appropriateness
- [ ] Test with students (tech-savvy)
- [ ] Get feedback from families

---

## 📝 Content Translation Workflow

### For Launch:

1. **Professional Translation:**
   - Hire professional Burmese translator
   - Provide context for each string
   - Review with native speakers

2. **Database Content:**
   - Start with popular dishes (translate first)
   - Add Burmese names gradually
   - Community can suggest translations

3. **Email Templates:**
   - Translate all transactional emails
   - Test with community members

### Post-Launch:

- Collect feedback on translations
- Improve based on community input
- Add more Burmese content over time

---

## 🎯 Success Metrics

- **Language Preference:** Track % using Burmese
- **Elderly Users:** Survey ease of use
- **Order Completion:** Compare rates by language
- **Community Feedback:** Collect testimonials

---

## 💡 Pro Tips for Codex

1. **Always provide English fallback** - Not all content will have Burmese
2. **Test with different text lengths** - Burmese can be longer
3. **Use proper font** - Noto Sans Myanmar is essential
4. **Locale persistence** - Store user's preference in cookies
5. **SEO consideration** - Use hreflang tags for both languages

---

**Making Mandalay Morning Star accessible to the entire LA Burmese community! 🇲🇲**
