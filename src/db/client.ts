import { drizzle } from "drizzle-orm/neon-http";

import { getDatabaseUrl } from "./env";
import * as schema from "./schema";

export function getDb() {
  return drizzle(getDatabaseUrl(), { schema });
}

export type Database = ReturnType<typeof getDb>;
