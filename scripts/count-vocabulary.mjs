import pg from "pg";
import { requireDatabaseUrl } from "./load-local-env.mjs";

const { Client } = pg;
const client = new Client({ connectionString: requireDatabaseUrl() });
await client.connect();
try {
  const result = await client.query(
    `SELECT cefr_level, COUNT(*)::int AS count
     FROM vocabulary_words
     WHERE is_active = 1
     GROUP BY cefr_level
     ORDER BY CASE cefr_level WHEN 'A1' THEN 1 WHEN 'A2' THEN 2 WHEN 'B1' THEN 3 WHEN 'B2' THEN 4 WHEN 'C1' THEN 5 WHEN 'C2' THEN 6 ELSE 7 END`,
  );
  const total = result.rows.reduce((sum, row) => sum + row.count, 0);
  console.table(result.rows);
  console.log(`Total active vocabulary: ${total}`);
} finally {
  await client.end();
}
