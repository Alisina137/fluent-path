import { sql } from "drizzle-orm";

import { getDb } from "./client";

export async function checkDatabaseConnection(): Promise<boolean> {
  const db = getDb();

  await db.execute(sql`select 1`);

  return true;
}
