/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["config"],
  eslint: {
    dirs: ['src', 'app', 'components', 'lib'],
  },
};

module.exports = nextConfig; 