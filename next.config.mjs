import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'handlebars', 'jsdom', 'isomorphic-dompurify'],
  allowedDevOrigins: ['localhost', '127.0.0.1', '*.local', '192.168.*.*'],
  experimental: {
    optimizePackageImports: ['ioredis', 'lucide-react'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
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
  // TODO: Fix existing lint errors and re-enable ESLint during builds.
  // Currently disabled to prevent build failures from pre-existing violations.
  eslint: { ignoreDuringBuilds: true },
};

export default withNextIntl(nextConfig);
