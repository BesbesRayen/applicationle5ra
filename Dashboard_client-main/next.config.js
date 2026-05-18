/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // required for Docker multi-stage build
  images: {
    domains: ['lh3.googleusercontent.com', 'ui-avatars.com'],
  },
};

module.exports = nextConfig;
