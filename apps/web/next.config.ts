// apps/web/next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Keep strict mode on
  reactStrictMode: true,

  /**
   * This tells Next how to trace files for server functions
   * when you are inside a monorepo on Windows.
   * It also silences the “workspace root inferred” warning.
   */
  outputFileTracingRoot: path.join(__dirname, "../../.."),
};

export default nextConfig;
