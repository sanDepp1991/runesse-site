/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias['@'] = process.cwd(); // ESM-safe alias to project root
    return config;
  },
};

export default nextConfig;
