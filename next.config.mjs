/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  compress: true,
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg', 'handlebars'],
  allowedDevOrigins: ['localhost', '127.0.0.1', '*.local', '192.168.*.*'],
  experimental: {
    optimizePackageImports: ['ioredis', 'barcode-detector'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
