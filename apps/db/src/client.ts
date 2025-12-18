import { PrismaClient } from "@prisma/client"
import { config as loadEnv } from "dotenv"
import fs from "fs"
import path from "path"

function tryLoadEnv(p: string) {
  try {
    if (fs.existsSync(p)) loadEnv({ path: p, override: false });
  } catch {}
}

// Monorepo-safe env loading: try common locations (no overrides)
const cwd = process.cwd();
tryLoadEnv(path.join(cwd, "apps/web/.env.local"));
tryLoadEnv(path.join(cwd, "apps/db/.env"));
tryLoadEnv(path.join(cwd, ".env.local"));
tryLoadEnv(path.join(cwd, ".env"));


const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
