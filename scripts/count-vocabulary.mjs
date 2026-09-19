import pg from "pg";
import { requireDatabaseUrl } from "./load-local-env.mjs";

const { Client } = pg;
const TARGETS = { A1: 1500, A2: 2500, B1: 3500, B2: 4000, C1: 4500, C2: 4000 };
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
  const byLevel = Object.fromEntries(result.rows.map((row) => [row.cefr_level, row.count]));
  const total = result.rows.reduce((sum, row) => sum + row.count, 0);
  const expectedTotal = Object.values(TARGETS).reduce((sum, value) => sum + value, 0);
  console.table(result.rows);
  console.log(`Total active vocabulary: ${total}`);

  const mismatches = Object.entries(TARGETS)
    .filter(([level, expected]) => Number(byLevel[level] ?? 0) !== expected)
    .map(([level, expected]) => `${level}: expected ${expected}, found ${Number(byLevel[level] ?? 0)}`);

  if (total !== expectedTotal || mismatches.length) {
    throw new Error(
      `Vocabulary catalog count mismatch. Expected exactly ${expectedTotal} active entries. ${mismatches.join("; ")}`,
    );
  }

  console.log("Vocabulary catalog verification passed.");
} finally {
  await client.end();
}
