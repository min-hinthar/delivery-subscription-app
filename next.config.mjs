import createNextIntlPlugin from 'next-intl/plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@/components/ui'],
  },
  async rewrites() {
    return [
      {
        source: '/__e2e__/tracking',
        destination: '/e2e/tracking',
      },
      {
        source: '/',
        destination: '/my',
        has: [
          {
            type: 'cookie',
            key: 'NEXT_LOCALE',
            value: 'my',
          },
        ],
      },
      {
        source: '/',
        destination: '/en',
      },
      {
        source: '/en/:path*',
        destination: '/en/:path*',
      },
      {
        source: '/my/:path*',
        destination: '/my/:path*',
      },
      {
        source: '/:path((?!en/|my/|api|_next|__e2e__|.*\\..*).*)',
        destination: '/my/:path*',
        has: [
          {
            type: 'cookie',
            key: 'NEXT_LOCALE',
            value: 'my',
          },
        ],
      },
      {
        source: '/:path((?!en/|my/|api|_next|__e2e__|.*\\..*).*)',
        destination: '/en/:path*',
      },
    ];
  },
  // Enable webpack bundle analyzer conditionally
  webpack: (config, { isServer }) => {
    // Only analyze in production client builds when ANALYZE is set
    if (!isServer && process.env.ANALYZE === 'true') {
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          reportFilename: './analyze.html',
          openAnalyzer: true,
        })
      );
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
