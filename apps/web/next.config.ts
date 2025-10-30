import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverExternalPackages: ["@prisma/client", "prisma"],
  },
  webpack(config) {
    // Ensure Prisma is included in the bundle
    config.externals = config.externals?.filter((external) => {
      if (typeof external === "function") {
        return !["@prisma/client", "prisma"].includes(external.name);
      }
      return true;
    });

    return config;
  },
};

export default nextConfig;
