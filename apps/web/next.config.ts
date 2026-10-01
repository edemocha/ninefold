import type { NextConfig } from 'next';

const config: NextConfig = {
  // A fully static site: no server ever sees a name or a birth date.
  output: 'export',
  images: { unoptimized: true },
  transpilePackages: ['@numerology/engine', '@numerology/content', '@numerology/composer'],
  reactStrictMode: true,
  poweredByHeader: false,
};

export default config;
