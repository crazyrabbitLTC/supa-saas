/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["config"],
  eslint: {
    dirs: ['src'],
  },
};

module.exports = nextConfig; 