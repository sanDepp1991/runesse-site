import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Prisma external so the query engine stays available at runtime
  serverExternalPackages: ["@prisma/client"],

  // Next.js moved this out of `experimental`
  outputFileTracingIncludes: {
    "/api/**/*": [
      "../../node_modules/.prisma/client/**",
      "../../node_modules/@prisma/client/**",
      "../../node_modules/.pnpm/**/.prisma/client/**",
      "../../node_modules/.pnpm/**/@prisma+client*/node_modules/.prisma/client/**",
    ],
  },
};

export default nextConfig;
