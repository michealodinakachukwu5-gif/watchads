import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzle?: ReturnType<typeof drizzle>;
};

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is required. Set it in your Vercel project: Settings → Environment Variables → DATABASE_URL",
    );
  }
  return url;
}

/**
 * Lazily create the connection pool. This avoids throwing during the build
 * step (e.g. on Vercel) when DATABASE_URL might not yet be injected into the
 * build environment. The pool is only created the first time a query runs.
 */
function getPool(): Pool {
  if (!globalForDb.__arenaNextJsPostgresqlPool) {
    globalForDb.__arenaNextJsPostgresqlPool = new Pool({
      connectionString: getDatabaseUrl(),
      // Many hosted Postgres providers (Supabase, Neon, Vercel Postgres)
      // require SSL. The connection string usually includes sslmode=require,
      // but we also relax cert checking which is common for managed DBs.
      ssl: shouldUseSsl() ? { rejectUnauthorized: false } : undefined,
    });
  }
  return globalForDb.__arenaNextJsPostgresqlPool;
}

function shouldUseSsl(): boolean {
  const url = process.env.DATABASE_URL ?? "";
  // Local dev (127.0.0.1 / localhost) doesn't need SSL.
  if (url.includes("localhost") || url.includes("127.0.0.1")) return false;
  // Hosted providers generally need SSL.
  return true;
}

// Export a lazily-initialised pool getter for code that needs raw access.
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const realPool = getPool();
    const value = (realPool as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(realPool) : value;
  },
});

/**
 * Lazily-initialised Drizzle client. Safe to import anywhere (including at the
 * top level of server components and route handlers) without crashing the
 * build when env vars are not present yet.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    if (!globalForDb.__arenaNextJsDrizzle) {
      globalForDb.__arenaNextJsDrizzle = drizzle(getPool());
    }
    const client = globalForDb.__arenaNextJsDrizzle;
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
