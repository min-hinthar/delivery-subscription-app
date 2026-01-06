import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isProduction = process.env.NODE_ENV === "production";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
  "font-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self'${isProduction ? "" : " 'unsafe-eval'"} https://js.stripe.com https://maps.googleapis.com https://maps.gstatic.com`,
  "frame-src https://js.stripe.com https://hooks.stripe.com",
  `connect-src 'self'${supabaseUrl ? ` ${supabaseUrl}` : ""} https://api.stripe.com https://maps.googleapis.com`,
].join("; ");

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin",
  },
  {
    key: "Cross-Origin-Resource-Policy",
    value: "same-site",
  },
  {
    key: "Content-Security-Policy-Report-Only",
    value: cspDirectives,
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  experimental: {
    turbopackUseSystemTlsCerts: true,
    optimizePackageImports: ["lucide-react", "@radix-ui/react-select"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.gstatic.com",
      },
    ],
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/__e2e__/tracking",
        destination: "/e2e/tracking",
      },
      {
        source: "/",
        destination: "/my",
        has: [
          {
            type: "cookie",
            key: "NEXT_LOCALE",
            value: "my",
          },
        ],
      },
      {
        source: "/",
        destination: "/en",
      },
      {
        source: "/en/:path*",
        destination: "/en/:path*",
      },
      {
        source: "/my/:path*",
        destination: "/my/:path*",
      },
      {
        source: "/:path((?!en/|my/|api|_next|__e2e__|.*\\..*).*)",
        destination: "/my/:path*",
        has: [
          {
            type: "cookie",
            key: "NEXT_LOCALE",
            value: "my",
          },
        ],
      },
      {
        source: "/:path((?!en/|my/|api|_next|__e2e__|.*\\..*).*)",
        destination: "/en/:path*",
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n.ts");

export default withNextIntl(nextConfig);
