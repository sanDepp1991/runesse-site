import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  experimental: { serverExternalPackages: ["@prisma/client", "prisma"] }
};
export default nextConfig;
