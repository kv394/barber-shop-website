import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin';
import webpack from 'webpack';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  transpilePackages: ['undici'],
  experimental: {
    serverActions: true,
    optimizePackageImports: ['ioredis', 'lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['lh3.googleusercontent.com'],
  },
  async headers() {
    return [
      {
        source: '/_next/static/:static*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  webpack: (config, { isServer }) => {
  // Existing webpack config (no changes needed)
  // Externalize problematic native modules for client builds
  config.externals = config.externals || [];
  if (!isServer) {
    config.externals.push({
      bufferutil: 'bufferutil',
      'utf-8-validate': 'utf-8-validate',
      canvas: 'canvas',
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      bufferutil: false,
      'utf-8-validate': false,
      canvas: false,
    };
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.node$/,
      use: 'null-loader',
    });
    // Removed IgnorePlugin for canvas and jsdom – handled via externals
  }
  // Ensure undici is externalized
  config.externals.push('undici');
  // Externalize canvas and jsdom to avoid native binary bundling
  config.externals.push({ canvas: 'commonjs2 canvas' });
  config.externals.push({ jsdom: 'commonjs2 jsdom' });
  return config;
},
eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
