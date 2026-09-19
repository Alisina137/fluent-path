import fs from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    source: { type: "string", default: "https://raw.githubusercontent.com/bonkey/words-cefr-dataset/main/word_cefr_minified.db" },
    output: { type: "string", default: "data/vocabulary/catalog-20000.json" },
  },
});

const TARGETS = { A1: 1500, A2: 2500, B1: 3500, B2: 4000, C1: 4500, C2: 4000 };
const LEVELS = Object.keys(TARGETS);
const dbFile = path.resolve(".cache/vocabulary/word_cefr_minified.db");
await fs.mkdir(path.dirname(dbFile), { recursive: true });
await fs.mkdir(path.dirname(path.resolve(values.output)), { recursive: true });

const response = await fetch(values.source);
if (!response.ok) throw new Error(`Vocabulary source download failed: ${response.status} ${response.statusText}`);
await fs.writeFile(dbFile, Buffer.from(await response.arrayBuffer()));

let DatabaseSync;
try {
  ({ DatabaseSync } = await import("node:sqlite"));
} catch {
  throw new Error("This command requires Node.js 22.5+ because it uses the built-in node:sqlite module.");
}

const db = new DatabaseSync(dbFile, { readOnly: true });
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((row) => row.name);
if (!tables.includes("words") || !tables.includes("word_pos")) {
  throw new Error("Unexpected CEFR source schema.");
}

const posColumns = db.prepare("PRAGMA table_info(word_pos)").all().map((row) => row.name);
const levelColumn = posColumns.includes("level") ? "level" : posColumns.includes("avg_level") ? "avg_level" : null;
if (!levelColumn) throw new Error("CEFR level column not found in word_pos.");

const posTagJoin = tables.includes("pos_tags") ? "LEFT JOIN pos_tags p ON p.tag_id = wp.pos_tag_id" : "";
const posSelect = tables.includes("pos_tags") ? "COALESCE(p.tag, 'other')" : "'other'";
const rows = db.prepare(`
  SELECT w.word AS term,
         ${posSelect} AS pos,
         wp.frequency_count AS frequency,
         wp.${levelColumn} AS numeric_level
  FROM word_pos wp
  JOIN words w ON w.word_id = wp.word_id
  ${posTagJoin}
  WHERE wp.${levelColumn} IS NOT NULL
  ORDER BY wp.frequency_count DESC
`).all();
db.close();

function levelOf(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n < 1.5) return "A1";
  if (n < 2.5) return "A2";
  if (n < 3.5) return "B1";
  if (n < 4.5) return "B2";
  if (n < 5.5) return "C1";
  return "C2";
}
function partOfSpeech(tag) {
  if (/^NN/.test(tag)) return "noun";
  if (/^VB/.test(tag)) return "verb";
  if (/^JJ/.test(tag)) return "adjective";
  if (/^RB/.test(tag)) return "adverb";
  if (/^PRP/.test(tag)) return "pronoun";
  if (/^IN/.test(tag)) return "preposition";
  if (/^CC/.test(tag)) return "conjunction";
  if (/^DT/.test(tag)) return "determiner";
  return "other";
}
function acceptable(term) {
  return /^[A-Za-z][A-Za-z'-]{1,39}$/.test(term) && !term.includes("--");
}

const selected = Object.fromEntries(LEVELS.map((level) => [level, []]));
const seen = new Set();
for (const row of rows) {
  const term = String(row.term ?? "").trim().toLowerCase();
  const level = levelOf(row.numeric_level);
  if (!level || !acceptable(term) || selected[level].length >= TARGETS[level]) continue;
  const key = term;
  if (seen.has(key)) continue;
  seen.add(key);
  selected[level].push({
    term,
    partOfSpeech: partOfSpeech(String(row.pos ?? "")),
    definition: "Definition enrichment pending.",
    example: `Learn how to use “${term}” naturally in context.`,
    cefrLevel: level,
    topic: "General",
    synonyms: [],
    translations: { en: term },
    source: "words-cefr-dataset",
    frequency: Number(row.frequency ?? 0),
  });
}

for (const level of LEVELS) {
  if (selected[level].length !== TARGETS[level]) {
    throw new Error(`Insufficient clean ${level} entries: needed ${TARGETS[level]}, found ${selected[level].length}.`);
  }
}

const catalog = LEVELS.flatMap((level) => selected[level]).map((row, index) => ({
  ...row,
  sortOrder: index + 1,
}));
if (catalog.length !== 20_000) throw new Error(`Expected 20000 entries, got ${catalog.length}.`);

await fs.writeFile(values.output, JSON.stringify({ words: catalog }, null, 2) + "\n", "utf8");
console.log("Prepared 20,000 CEFR vocabulary entries:");
for (const level of LEVELS) console.log(`  ${level}: ${selected[level].length}`);
console.log(`Output: ${values.output}`);
console.log("Note: source-backed CEFR/POS/frequency are ready; multilingual definitions/translations remain enrichment fields.");
