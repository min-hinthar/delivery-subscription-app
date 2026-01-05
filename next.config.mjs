import createNextIntlPlugin from 'next-intl/plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const withNextIntl = createNextIntlPlugin('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: ['lucide-react', '@/components/ui'],
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
