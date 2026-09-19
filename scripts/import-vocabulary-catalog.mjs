import "dotenv/config";
import fs from "node:fs/promises";
import pg from "pg";

const { Client } = pg;
const TARGET = 20_000;
const LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const LANGUAGES = ["en", "es", "fa", "ar", "zh", "fr", "de", "pt", "hi", "ja", "ko"];

const file = process.argv[2];
if (!file) {
  throw new Error("Usage: npm run vocabulary:import -- <catalog.json>");
}

const raw = JSON.parse(await fs.readFile(file, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.words;
if (!Array.isArray(rows)) throw new Error("Catalog must be a JSON array or { words: [] }.");
if (rows.length !== TARGET) throw new Error(`Catalog must contain exactly ${TARGET} entries; received ${rows.length}.`);

const seen = new Set();
const clean = rows.map((row, index) => {
  const term = String(row.term ?? "").trim();
  const cefrLevel = String(row.cefrLevel ?? "").toUpperCase();
  const key = `${term.toLowerCase()}::${cefrLevel}`;
  if (!term || !LEVELS.has(cefrLevel)) throw new Error(`Invalid term/CEFR at row ${index + 1}.`);
  if (seen.has(key)) throw new Error(`Duplicate term/CEFR: ${term} (${cefrLevel}).`);
  seen.add(key);

  const translations = row.translations ?? {};
  const normalizedTranslations = Object.fromEntries(
    LANGUAGES.map((lang) => [lang, String(translations[lang] ?? (lang === "en" ? term : "")).trim()]),
  );

  return {
    term,
    partOfSpeech: String(row.partOfSpeech ?? "other").trim() || "other",
    definition: String(row.definition ?? "").trim(),
    example: String(row.example ?? "").trim(),
    cefrLevel,
    topic: String(row.topic ?? "General").trim() || "General",
    synonyms: Array.isArray(row.synonyms) ? row.synonyms.map(String).map((value) => value.trim()).filter(Boolean).slice(0, 8) : [],
    translations: normalizedTranslations,
    sortOrder: Number.isInteger(row.sortOrder) ? row.sortOrder : index + 1,
  };
});

for (const [index, row] of clean.entries()) {
  if (!row.definition || !row.example) throw new Error(`Missing definition/example at row ${index + 1}: ${row.term}.`);
}

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

try {
  await client.query("BEGIN");
  const batchSize = 250;

  for (let start = 0; start < clean.length; start += batchSize) {
    const batch = clean.slice(start, start + batchSize);
    const values = [];
    const params = [];

    batch.forEach((row, i) => {
      const offset = i * 9;
      values.push(`($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}::text[], $${offset + 8}::jsonb, $${offset + 9}, 1, NOW(), NOW())`);
      params.push(row.term, row.partOfSpeech, row.definition, row.example, row.cefrLevel, row.topic, row.synonyms, JSON.stringify(row.translations), row.sortOrder);
    });

    await client.query(
      `INSERT INTO vocabulary_words
       (term, part_of_speech, definition, example, cefr_level, topic, synonyms, translations, sort_order, is_active, created_at, updated_at)
       VALUES ${values.join(",")}
       ON CONFLICT (term, cefr_level) DO UPDATE SET
         part_of_speech = EXCLUDED.part_of_speech,
         definition = EXCLUDED.definition,
         example = EXCLUDED.example,
         topic = EXCLUDED.topic,
         synonyms = EXCLUDED.synonyms,
         translations = EXCLUDED.translations,
         sort_order = EXCLUDED.sort_order,
         is_active = 1,
         updated_at = NOW()`,
      params,
    );
  }

  const result = await client.query("SELECT COUNT(*)::int AS count FROM vocabulary_words WHERE is_active = 1");
  if (result.rows[0].count < TARGET) throw new Error(`Import finished below target: ${result.rows[0].count} active entries.`);

  await client.query("COMMIT");
  console.log(`Vocabulary import complete: ${result.rows[0].count} active entries.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
