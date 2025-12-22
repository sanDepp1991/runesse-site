/** @type {import('next').NextConfig} */
const nextConfig = {
  // Critical: keep Prisma out of Next's bundling so the engine stays in node_modules
  serverExternalPackages: ["@prisma/client"],

  // Critical: ensure the Prisma engine files are included in the serverless output
  experimental: {
    outputFileTracingIncludes: {
      "/api/**/*": [
        "../../node_modules/.prisma/client/**",
        "../../node_modules/@prisma/client/**",
        "../../node_modules/.pnpm/**/.prisma/client/**",
        "../../node_modules/.pnpm/**/@prisma+client*/node_modules/.prisma/client/**",
      ],
    },
  },
};

module.exports = nextConfig;