/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: undefined, // App Router handles i18n differently
  // Vietnamese locale support via metadata API in App Router
  // Default language is Vietnamese (vi)
  reactStrictMode: true,
  experimental: {},
};

module.exports = nextConfig;
