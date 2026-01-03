/**
 * Design Tokens for Mandalay Morning Star
 * Burmese-inspired color palette and design system
 */

export const colors = {
  brand: {
    primary: '#D4A574',   // Golden (like Shwedagon Pagoda)
    secondary: '#8B4513', // Deep brown (traditional wood)
    accent: '#DC143C',    // Crimson (Myanmar flag)
  },
  semantic: {
    success: '#10B981',   // Emerald
    warning: '#F59E0B',   // Amber
    error: '#EF4444',     // Red
    info: '#3B82F6',      // Blue
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
    950: '#030712',
  },
} as const;

export const gradients = {
  hero: 'linear-gradient(135deg, #D4A574 0%, #8B4513 100%)',
  card: 'linear-gradient(180deg, rgba(212,165,116,0.1) 0%, rgba(255,255,255,0) 100%)',
  cta: 'linear-gradient(90deg, #DC143C 0%, #8B4513 100%)',
  primary: 'linear-gradient(90deg, #D4A574 0%, #C19663 50%, #8B4513 100%)',
} as const;

export const typography = {
  fontFamily: {
    display: '"Playfair Display", serif',  // Elegant for headings
    body: '"Inter", sans-serif',            // Readable for body
    ui: '"Inter", sans-serif',              // UI elements
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.563rem', // 25px
    '3xl': '1.953rem', // 31px
    '4xl': '2.441rem', // 39px
    '5xl': '3.052rem', // 49px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const spacing = {
  component: '1rem',      // 16px - Between UI elements
  section: '2rem',        // 32px - Between page sections
  layout: '3rem',         // 48px - Between layout blocks
  page: '4rem',           // 64px - Between pages
} as const;

export const borderRadius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.25rem', // 20px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
} as const;

export const animation = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  modal: 1030,
  overlay: 1040,
  toast: 1050,
} as const;
