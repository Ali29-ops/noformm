import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import * as schema from "./schema";
import { seedDatabase } from "./seed";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

type DbGlobal = typeof globalThis & {
  __noformDb?: Promise<Db>;
};

const g = globalThis as DbGlobal;

async function init(): Promise<Db> {
  const url = process.env.DATABASE_URL ?? "file:./data/noform.db";
  if (url.startsWith("file:")) {
    const file = url.slice("file:".length);
    await mkdir(path.dirname(path.resolve(process.cwd(), file)), { recursive: true });
  }
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  await seedDatabase(db);
  return db;
}

export function getDb(): Promise<Db> {
  if (!g.__noformDb) {
    g.__noformDb = init().catch((error) => {
      g.__noformDb = undefined;
      throw error;
    });
  }
  return g.__noformDb;
}

export { schema };
