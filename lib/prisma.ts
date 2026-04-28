import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function logDatabaseUrlShapeOnce() {
  const g = globalThis as unknown as { __crewlink_db_url_logged?: boolean };
  if (g.__crewlink_db_url_logged) return;
  g.__crewlink_db_url_logged = true;

  const raw = process.env.DATABASE_URL;
  if (!raw) {
    console.warn("[prisma] DATABASE_URL is not set");
    return;
  }
  try {
    const u = new URL(raw);
    // Never log credentials.
    const params = Array.from(u.searchParams.keys()).sort();
    console.log("[prisma] DATABASE_URL target", {
      host: u.hostname,
      port: u.port || "(default)",
      database: u.pathname.replace(/^\//, "") || "(none)",
      params,
    });
  } catch {
    console.warn("[prisma] DATABASE_URL is set but not a valid URL");
  }
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// In serverless environments, verify what connection string is being used.
logDatabaseUrlShapeOnce();
