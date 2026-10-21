/** @type {import('next').NextConfig} */

const { i18n } = require('./next-i18next.config');

const basePath = (process.env.BASE_PATH || '').replace(/\/$/, '');
const staticExport = process.env.GITHUB_PAGES === 'true';

const imageConfig = {
  domains: [
    'via.placeholder.com',
    'res.cloudinary.com',
    's3.amazonaws.com',
    '18.141.64.26',
    '127.0.0.1',
    'localhost',
    'picsum.photos',
    'pickbazar-sail.test',
    'pickbazarlaravel.s3.ap-southeast-1.amazonaws.com',
    'shievon-images-prod.s3.ap-south-1.amazonaws.com',
    'lh3.googleusercontent.com',
    '127.0.0.1:8000',
  ],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'shievon-images-prod.s3.ap-south-1.amazonaws.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.s3.amazonaws.com',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '*.s3.*.amazonaws.com',
      pathname: '/**',
    },
  ],
  unoptimized: staticExport || process.env.NODE_ENV === 'development',
};

const nextConfig = {
  reactStrictMode: true,
  images: imageConfig,
  ...(staticExport
    ? {
        output: 'export',
        trailingSlash: true,
        ...(basePath ? { basePath } : {}),
      }
    : { i18n }),
  ...(process.env.APPLICATION_MODE === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
};

module.exports = nextConfig;
