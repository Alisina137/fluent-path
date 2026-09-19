# Vocabulary catalog

Phase 8 uses a reproducible 20,000-entry CEFR catalog pipeline instead of committing a huge generated JSON file.

## Distribution

- A1: 1,500
- A2: 2,500
- B1: 3,500
- B2: 4,000
- C1: 4,500
- C2: 4,000
- Total: 20,000

## Source

The preparation script downloads the MIT-licensed `bonkey/words-cefr-dataset` SQLite database and selects clean, high-frequency unique English terms by CEFR level. The upstream project derives CEFR/POS/frequency from CEFR-J and linguistic frequency resources.

## Commands

```powershell
npm run vocabulary:prepare
npm run vocabulary:import -- data/vocabulary/catalog-20000.json
npm run vocabulary:count
```

Or run the complete data setup:

```powershell
npm run vocabulary:setup
```

The importer requires exactly 20,000 records and rejects duplicate term/CEFR combinations. It upserts in a transaction.

## Enrichment status

CEFR level, term, part of speech, source frequency, and English identity translation are source-backed. Definitions, examples, topics, synonyms, and non-English translations are deliberately not fabricated by the preparation pipeline. The UI/service must tolerate absent enrichment while the catalog is progressively enriched.
