import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

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
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
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
