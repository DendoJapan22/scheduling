import "server-only";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

// Postgres in production (DATABASE_URL), PGlite (embedded Postgres) in local dev.
// Both share the same schema and the same SQL migrations in ./drizzle.
const globalForDb = globalThis as unknown as { __aiteruDb?: Promise<Db> };

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5 });
    return drizzle(pool, { schema }) as unknown as Db;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const client = new PGlite(process.env.PGLITE_DATA_DIR ?? ".pglite");
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  return db as unknown as Db;
}

export function getDb(): Promise<Db> {
  if (!globalForDb.__aiteruDb) {
    globalForDb.__aiteruDb = createDb().catch((err) => {
      globalForDb.__aiteruDb = undefined;
      throw err;
    });
  }
  return globalForDb.__aiteruDb;
}
