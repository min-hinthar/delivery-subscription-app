# 🇲🇲 Burmese Language Support (i18n) - Implementation Guide

**For:** Mandalay Morning Star Burmese Kitchen
**Target:** Burmese Community in Los Angeles (especially students, families, elderly)
**Priority:** P0 (Critical for Community Engagement)
**Estimated Effort:** 2-3 hours
**Business Impact:** Accessible to entire Burmese community

---

## 🎯 Why Burmese Language Support Matters

**Target Demographics:**
- **Elderly community members** - More comfortable reading Burmese
- **Recent immigrants** - Limited English proficiency
- **Students** - Bilingual, prefer option to switch
- **Families** - Parents read Burmese, kids read English

**Cultural Connection:**
- Shows respect for Burmese culture
- Builds trust with community
- Makes ordering easier for all ages
- Differentiates from competitors

---

## 🏗️ Implementation Strategy

### Approach: next-intl

**Why next-intl:**
- ✅ Built for Next.js App Router
- ✅ Server + client components
- ✅ Type-safe translations
- ✅ Automatic locale detection
- ✅ SEO-friendly (locale in URL)
- ✅ Small bundle size

---

## 📦 Setup

### 1. Install Dependencies

```bash
pnpm add next-intl
```

### 2. Create i18n Configuration

**`src/i18n.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'my'] as const; // en = English, my = Myanmar/Burmese
export type Locale = (typeof locales)[number];

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

### 3. Update Next.js Config

**`next.config.js`**

```javascript
const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

module.exports = withNextIntl({
  // ... your existing config
});
```

### 4. Create Middleware for Locale Detection

**`src/middleware.ts`**

```typescript
import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

export default createMiddleware({
  locales,
  defaultLocale: 'en',
  localePrefix: 'as-needed', // Only add /my for Burmese, not /en for English
  localeDetection: true, // Auto-detect from browser
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

---

## 📝 Translation Files

### English Translations

**`messages/en.json`**

```json
{
  "common": {
    "appName": "Mandalay Morning Star",
    "tagline": "Authentic Burmese Cuisine in Los Angeles",
    "loading": "Loading...",
    "error": "An error occurred",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "close": "Close"
  },
  "nav": {
    "home": "Home",
    "menu": "Menu",
    "weeklyMenu": "Weekly Menu",
    "schedule": "Schedule",
    "track": "Track Delivery",
    "account": "Account",
    "login": "Log In",
    "signup": "Sign Up",
    "logout": "Log Out"
  },
  "home": {
    "hero": {
      "title": "Weekly Burmese Food Delivery",
      "subtitle": "Fresh, authentic Burmese dishes delivered to your door every Saturday",
      "cta": "View This Week's Menu",
      "zipCheck": "Enter your ZIP code to check availability"
    },
    "features": {
      "fresh": {
        "title": "Fresh Ingredients",
        "description": "Sourced from local Asian markets daily"
      },
      "authentic": {
        "title": "Authentic Recipes",
        "description": "Traditional family recipes from Mandalay"
      },
      "convenient": {
        "title": "Convenient Delivery",
        "description": "Every Saturday, 10 AM - 4 PM"
      }
    }
  },
  "menu": {
    "weekly": "This Week's Menu",
    "weekOf": "Week of {start} - {end}",
    "orderDeadline": "Order by {deadline}",
    "delivery": "Delivery: {date}",
    "noMenu": "No menu available yet. Check back soon!",
    "dishDetails": "Dish Details",
    "addToCart": "Add to Cart",
    "ingredients": "Ingredients",
    "allergens": "Allergens",
    "spiceLevel": "Spice Level",
    "vegetarian": "Vegetarian",
    "vegan": "Vegan",
    "glutenFree": "Gluten-Free"
  },
  "packages": {
    "title": "Choose Your Package",
    "packageA": {
      "name": "Package A",
      "description": "Perfect for one person",
      "dishes": "7 dishes (1 per day)",
      "price": "$85/week"
    },
    "packageB": {
      "name": "Package B",
      "description": "Great for couples or variety lovers",
      "dishes": "14 dishes (2 per day)",
      "price": "$155/week",
      "badge": "Most Popular"
    },
    "packageC": {
      "name": "Package C",
      "description": "Best for families",
      "dishes": "21 dishes (3 per day)",
      "price": "$220/week"
    },
    "includes": "Includes:",
    "saturdayDelivery": "Saturday delivery",
    "freshIngredients": "Fresh ingredients",
    "authenticRecipes": "Authentic recipes"
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
  "tracking": {
    "title": "Track Your Delivery",
    "enterCode": "Enter your tracking code",
    "eta": "Estimated arrival",
    "status": {
      "pending": "Preparing your order",
      "outForDelivery": "Out for delivery",
      "delivered": "Delivered",
      "completed": "Completed"
    },
    "driverArriving": "Your driver is arriving soon!",
    "contactDriver": "Contact Driver"
  },
  "auth": {
    "login": {
      "title": "Welcome Back",
      "subtitle": "Log in to your account",
      "email": "Email Address",
      "password": "Password",
      "forgotPassword": "Forgot password?",
      "noAccount": "Don't have an account?",
      "signUpLink": "Sign up here"
    },
    "signup": {
      "title": "Join Our Community",
      "subtitle": "Create your account",
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "hasAccount": "Already have an account?",
      "loginLink": "Log in here"
    }
  },
  "errors": {
    "required": "This field is required",
    "invalidEmail": "Invalid email address",
    "invalidPhone": "Invalid phone number",
    "invalidZip": "Invalid ZIP code",
    "generic": "Something went wrong. Please try again."
  }
}
```

### Burmese Translations

**`messages/my.json`**

```json
{
  "common": {
    "appName": "မန္တလေး မော်နင်းစတား",
    "tagline": "လော့စ်အိန်ဂျယ်လိစ်တွင် စစ်မှန်သော မြန်မာ့အစားအစာ",
    "loading": "စောင့်ဆိုင်းနေပါသည်...",
    "error": "အမှားတစ်ခု ဖြစ်ပေါ်ခဲ့သည်",
    "back": "နောက်သို့",
    "next": "ရှေ့သို့",
    "submit": "တင်သွင်းမည်",
    "cancel": "မလုပ်တော့",
    "save": "သိမ်းမည်",
    "delete": "ဖျက်မည်",
    "edit": "ပြင်ဆင်မည်",
    "close": "ပိတ်မည်"
  },
  "nav": {
    "home": "ပင်မ",
    "menu": "မီနူး",
    "weeklyMenu": "အပတ်စဉ် မီနူး",
    "schedule": "အချိန်ဇယား",
    "track": "ပို့ဆောင်မှု ခြေရာခံ",
    "account": "အကောင့်",
    "login": "အကောင့်ဝင်မည်",
    "signup": "စာရင်းသွင်းမည်",
    "logout": "ထွက်မည်"
  },
  "home": {
    "hero": {
      "title": "အပတ်စဉ် မြန်မာ့အစားအစာ ပို့ဆောင်ခြင်း",
      "subtitle": "လတ်ဆတ်ပြီး စစ်မှန်သော မြန်မာဟင်းလျာများကို စနေနေ့တိုင်း သင့်အိမ်သို့ ပို့ဆောင်ပေးပါသည်",
      "cta": "ဤအပတ် မီနူး ကြည့်မည်",
      "zipCheck": "သင့်ဧရိယာ စစ်ဆေးရန် ZIP ကုဒ် ထည့်ပါ"
    },
    "features": {
      "fresh": {
        "title": "လတ်ဆတ်သော ပစ္စည်းများ",
        "description": "ဒေသခံ အာရှ စျေးများမှ နေ့စဉ် ရယူပါသည်"
      },
      "authentic": {
        "title": "စစ်မှန်သော ချက်နည်းများ",
        "description": "မန္တလေးမှ ရိုးရာ မိသားစု ချက်နည်းများ"
      },
      "convenient": {
        "title": "အဆင်ပြေသော ပို့ဆောင်မှု",
        "description": "စနေနေ့တိုင်း နံနက် ၁၀ နာရီ မှ ညနေ ၄ နာရီ"
      }
    }
  },
  "menu": {
    "weekly": "ဤအပတ် မီနူး",
    "weekOf": "{start} မှ {end} အပတ်",
    "orderDeadline": "{deadline} အတွင်း မှာယူပါ",
    "delivery": "ပို့ဆောင်မည့်နေ့: {date}",
    "noMenu": "မီနူး မရှိသေးပါ။ နောက်တစ်ကြိမ် ပြန်ကြည့်ပါ။",
    "dishDetails": "ဟင်းလျာ အသေးစိတ်",
    "addToCart": "ခြင်းတောင်းထဲ ထည့်မည်",
    "ingredients": "ပါဝင်ပစ္စည်းများ",
    "allergens": "မတည့်တတ်သော အရာများ",
    "spiceLevel": "စပ်ဆ အဆင့်",
    "vegetarian": "သက်သတ်လွတ်",
    "vegan": "ဗီဂင်",
    "glutenFree": "ဂလူတင် မပါသော"
  },
  "packages": {
    "title": "သင့် အစီအစဉ် ရွေးချယ်ပါ",
    "packageA": {
      "name": "အစီအစဉ် A",
      "description": "တစ်ဦးတည်းအတွက် အကောင်းဆုံး",
      "dishes": "၇ ပွဲ (တစ်နေ့ ၁ ပွဲ)",
      "price": "တစ်အပတ် $85"
    },
    "packageB": {
      "name": "အစီအစဉ် B",
      "description": "စုံတွဲများ သို့မဟုတ် အမျိုးမျိုးကြိုက်သူများအတွက်",
      "dishes": "၁၄ ပွဲ (တစ်နေ့ ၂ ပွဲ)",
      "price": "တစ်အပတ် $155",
      "badge": "လူကြိုက်အများဆုံး"
    },
    "packageC": {
      "name": "အစီအစဉ် C",
      "description": "မိသားစုများအတွက် အကောင်းဆုံး",
      "dishes": "၂၁ ပွဲ (တစ်နေ့ ၃ ပွဲ)",
      "price": "တစ်အပတ် $220"
    },
    "includes": "ပါဝင်သည်များ:",
    "saturdayDelivery": "စနေနေ့ ပို့ဆောင်မှု",
    "freshIngredients": "လတ်ဆတ်သော ပစ္စည်းများ",
    "authenticRecipes": "စစ်မှန်သော ချက်နည်းများ"
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
  "tracking": {
    "title": "သင့် ပို့ဆောင်မှု ခြေရာခံပါ",
    "enterCode": "သင့် ခြေရာခံ ကုဒ် ထည့်ပါ",
    "eta": "ခန့်မှန်း ရောက်ချိန်",
    "status": {
      "pending": "သင့်အမှာကို ပြင်ဆင်နေပါသည်",
      "outForDelivery": "ပို့ဆောင်နေပါပြီ",
      "delivered": "ပို့ဆောင်ပြီးပါပြီ",
      "completed": "ပြီးစီးပါပြီ"
    },
    "driverArriving": "သင့်ယာဉ်မောင်း မကြာမီ ရောက်ပါမည်!",
    "contactDriver": "ယာဉ်မောင်းကို ဆက်သွယ်မည်"
  },
  "auth": {
    "login": {
      "title": "ပြန်လည် ကြိုဆိုပါသည်",
      "subtitle": "သင့်အကောင့်သို့ ဝင်ရောက်ပါ",
      "email": "အီးမေးလ်",
      "password": "လျှို့ဝှက်နံပါတ်",
      "forgotPassword": "လျှို့ဝှက်နံပါတ် မေ့သွားပါသလား?",
      "noAccount": "အကောင့် မရှိသေးပါလား?",
      "signUpLink": "ဤနေရာတွင် စာရင်းသွင်းပါ"
    },
    "signup": {
      "title": "ကျွန်ုပ်တို့၏ အသိုင်းအဝိုင်းသို့ ပူးပေါင်းပါ",
      "subtitle": "သင့်အကောင့် ဖန်တီးပါ",
      "name": "အမည်အပြည့်အစုံ",
      "email": "အီးမေးလ်",
      "phone": "ဖုန်းနံပါတ်",
      "hasAccount": "အကောင့် ရှိပြီးသားလား?",
      "loginLink": "ဤနေရာတွင် ဝင်ရောက်ပါ"
    }
  },
  "errors": {
    "required": "ဤအကွက်ကို ဖြည့်ရန် လိုအပ်သည်",
    "invalidEmail": "အီးမေးလ် မမှန်ကန်ပါ",
    "invalidPhone": "ဖုန်းနံပါတ် မမှန်ကန်ပါ",
    "invalidZip": "ZIP ကုဒ် မမှန်ကန်ပါ",
    "generic": "တစ်စုံတစ်ရာ မှားယွင်းသွားပါသည်။ ထပ်မံကြိုးစားကြည့်ပါ။"
  }
}
```

---

## 🎨 Using Translations in Components

### Server Components

```typescript
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
      <button>{t('hero.cta')}</button>
    </div>
  );
}
```

### Client Components

```typescript
"use client";

import { useTranslations } from 'next-intl';

export function MenuCard({ dish }: { dish: Dish }) {
  const t = useTranslations('menu');
  const c = useTranslations('common');

  return (
    <div className="rounded-lg border p-4">
      <h3>{dish.name}</h3>
      {dish.name_my && <p className="text-sm text-slate-500">{dish.name_my}</p>}

      <button>{t('addToCart')}</button>
    </div>
  );
}
```

### With Parameters

```typescript
const t = useTranslations('menu');

// Interpolation
<p>{t('weekOf', { start: 'Dec 15', end: 'Dec 21' })}</p>
// Output: "Week of Dec 15 - Dec 21"

<p>{t('orderDeadline', { deadline: 'Wednesday, 11:59 PM' })}</p>
// Output: "Order by Wednesday, 11:59 PM"
```

### Pluralization

```json
{
  "cart": {
    "items": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
  }
}
```

```typescript
<span>{t('cart.items', { count: cartItems.length })}</span>
// count=0 → "No items"
// count=1 → "1 item"
// count=5 → "5 items"
```

---

## 🌐 Language Switcher Component

**`src/components/navigation/language-switcher.tsx`**

```typescript
"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'my', label: 'Burmese', nativeLabel: 'မြန်မာ' },
];

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove current locale from pathname if present
    const pathnameWithoutLocale = pathname.replace(/^\/my/, '');

    // Add new locale to pathname (if not English)
    const newPathname = newLocale === 'en'
      ? pathnameWithoutLocale
      : `/my${pathnameWithoutLocale}`;

    router.push(newPathname);
    router.refresh();
  };

  const currentLanguage = LANGUAGES.find((lang) => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline">{currentLanguage?.nativeLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => switchLanguage(language.code)}
            className={locale === language.code ? 'bg-slate-100 dark:bg-slate-800' : ''}
          >
            <span className="mr-2">{language.nativeLabel}</span>
            <span className="text-sm text-slate-500">({language.label})</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Add to Header:**

```typescript
import { LanguageSwitcher } from '@/components/navigation/language-switcher';

export function Header() {
  return (
    <header>
      {/* ... other nav items ... */}
      <LanguageSwitcher />
    </header>
  );
}
```

---

## 🎨 Styling Burmese Text

### Font Configuration

**`src/app/layout.tsx`**

```typescript
import { Noto_Sans_Myanmar } from 'next/font/google';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const notoSansMyanmar = Noto_Sans_Myanmar({
  subsets: ['myanmar'],
  variable: '--font-myanmar',
  weight: ['400', '500', '600', '700'],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansMyanmar.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**`globals.css`**

```css
@layer base {
  /* Default font for English */
  body {
    font-family: var(--font-sans), system-ui, sans-serif;
  }

  /* Burmese text styling */
  [lang="my"],
  [lang="my"] * {
    font-family: var(--font-myanmar), var(--font-sans), sans-serif;
    line-height: 1.8; /* Burmese needs more line height */
  }

  /* Increase font size slightly for Burmese readability */
  html[lang="my"] {
    font-size: 17px;
  }

  @media (max-width: 768px) {
    html[lang="my"] {
      font-size: 16px;
    }
  }
}
```

---

## 📱 Burmese-Specific UI Adjustments

### Text Direction & Spacing

```css
/* Burmese-specific adjustments */
[lang="my"] {
  /* More spacing for readability */
  letter-spacing: 0.01em;
  word-spacing: 0.05em;

  /* Buttons need more padding */
  button,
  .btn {
    padding: 0.75rem 1.25rem;
  }

  /* Form inputs need larger font */
  input,
  textarea,
  select {
    font-size: 16px; /* Prevents zoom on iOS */
  }

  /* Headings need more weight */
  h1, h2, h3, h4, h5, h6 {
    font-weight: 600;
  }
}
```

---

## 🗄️ Database: Bilingual Content

### Add Burmese Columns to Existing Tables

```sql
-- Add Burmese name/description to menu items
alter table public.menu_items
  add column if not exists name_my text,
  add column if not exists description_my text,
  add column if not exists ingredients_my text[];

-- Add Burmese labels to categories
alter table public.menu_categories
  add column if not exists name_my text,
  add column if not exists description_my text;

-- Add Burmese to email templates
alter table public.email_templates
  add column if not exists subject_my text,
  add column if not exists body_my text;
```

### Query Based on Locale

```typescript
// Helper to get localized field
function getLocalizedField(item: any, field: string, locale: string) {
  const localizedField = `${field}_my`;
  return locale === 'my' && item[localizedField]
    ? item[localizedField]
    : item[field];
}

// Usage
const dish = await supabase.from('menu_items').select('*').single();
const dishName = getLocalizedField(dish.data, 'name', locale);
const dishDescription = getLocalizedField(dish.data, 'description', locale);
```

---

## 📧 Bilingual Emails

### Email Template Selection

```typescript
import { useLocale } from 'next-intl';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { OrderConfirmationEmailMy } from '@/emails/order-confirmation-my';

async function sendOrderConfirmation(user: User, order: Order) {
  const userLocale = user.preferred_locale || 'en';

  const emailComponent = userLocale === 'my'
    ? OrderConfirmationEmailMy
    : OrderConfirmationEmail;

  await resend.emails.send({
    from: 'Mandalay Morning Star <orders@mandalaymorningstar.com>',
    to: user.email,
    subject: userLocale === 'my'
      ? 'သင့်မှာကြားမှု အတည်ပြုချက်'
      : 'Order Confirmation',
    react: emailComponent({ user, order }),
  });
}
```

---

## 🧪 Testing Burmese Support

### Manual Testing:
- [ ] All pages display correctly in Burmese
- [ ] Fonts render properly (no boxes/missing glyphs)
- [ ] Text is readable on mobile (font size appropriate)
- [ ] Line height is comfortable for Burmese script
- [ ] Language switcher works on all pages
- [ ] URL changes to `/my/...` when switching to Burmese

### Automated Testing:
```typescript
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import myMessages from '@/messages/my.json';

describe('Burmese i18n', () => {
  it('renders English content', () => {
    render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <HomePage />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('Weekly Burmese Food Delivery')).toBeInTheDocument();
  });

  it('renders Burmese content', () => {
    render(
      <NextIntlClientProvider locale="my" messages={myMessages}>
        <HomePage />
      </NextIntlClientProvider>
    );

    expect(screen.getByText('အပတ်စဉ် မြန်မာ့အစားအစာ ပို့ဆောင်ခြင်း')).toBeInTheDocument();
  });
});
```

---

## 📊 SEO for Bilingual Site

### Hreflang Tags

```typescript
// app/[locale]/layout.tsx
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale });

  return {
    title: t('common.appName'),
    description: t('common.tagline'),
    alternates: {
      languages: {
        'en-US': '/',
        'my-MM': '/my',
      },
    },
  };
}
```

---

## 🚀 Implementation Timeline

**Week 1:**
- Day 1: Install next-intl + setup config
- Day 2: Create English translations (extract all strings)
- Day 3: Create Burmese translations (work with native speaker)

**Week 2:**
- Day 4: Convert all components to use translations
- Day 5: Add Burmese font + styling adjustments
- Day 6: Language switcher component

**Week 3:**
- Day 7: Add Burmese columns to database
- Day 8: Bilingual email templates
- Day 9: Testing + bug fixes

---

## 💡 Content Guidelines

### Working with Burmese Translators:
1. Hire native Burmese speaker from LA community
2. Provide context for each string (where it appears)
3. Review translations with elderly community members
4. Test with real users (students, families, elderly)

### Translation Best Practices:
- ✅ Use formal Burmese for official communications
- ✅ Use informal for friendly messages (order confirmations)
- ✅ Transliterate food names that don't have direct translations
- ✅ Keep English brand names (Mandalay Morning Star)
- ✅ Provide both languages for important legal text

---

**This makes Mandalay Morning Star accessible to the entire Burmese community in Los Angeles!** 🇲🇲✨
