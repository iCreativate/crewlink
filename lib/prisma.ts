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

    // Common footgun: using Supabase "Transaction pooler" (PgBouncer) without telling Prisma.
    // This often manifests as: prepared statement "s0" already exists.
    const port = u.port || "";
    const looksLikeTransactionPooler = port === "6543" || params.includes("pgbouncer");
    const hasPgbouncerParam = u.searchParams.get("pgbouncer") === "true";
    const statementCacheSize = u.searchParams.get("statement_cache_size");

    if (looksLikeTransactionPooler && !hasPgbouncerParam) {
      console.warn(
        "[prisma] DATABASE_URL looks pooled (PgBouncer) but is missing `pgbouncer=true` (can cause prepared statement errors).",
      );
    }

    if (looksLikeTransactionPooler && statementCacheSize !== "0") {
      console.warn(
        "[prisma] For PgBouncer/transaction pooling, add `statement_cache_size=0` to DATABASE_URL to avoid prepared statement collisions.",
      );
    }
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
