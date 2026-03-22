---
name: sync-collections
description: "Use when: syncing MongoDB collection constants from database/skolo.dbml into src/shared/constants/collections.ts. Parses DBML table names, preserves legacy code-only constants, orders DBML-backed collections to match the schema file, and regenerates *_COLLECTION exports."
user-invocable: true
---

# Sync Collections Skill

## Purpose

Sync `src/shared/constants/collections.ts` from the table definitions in `database/skolo.dbml` so the collection constants stay aligned with the schema and remain easy to read.

## How to Use This Skill

### Step 1: Apply the sync

Use the bundled helper to rewrite the file directly:

```bash
node .agents/skills/sync-collections/scripts/sync-collections.js --write
```

### Step 2: Review the result

The helper will:

- Read table names from `database/skolo.dbml`
- Rebuild `COLLECTIONS` in DBML order
- Append preserved code-only constants after the DBML-backed block
- Regenerate all `*_COLLECTION` exports in the same final order
- Print a summary of added, updated, preserved, and unchanged entries

## Script Options

- `--dry-run` - Print drift and planned ordering without writing
- `--write` - Rewrite `src/shared/constants/collections.ts`
- `--source <path>` - Override the DBML source path (defaults to `database/skolo.dbml`)

## AI Agent Instructions

When a user asks to sync collection names:

1. Do not ask follow-up questions when the default source and target files are available.
2. Treat `database/skolo.dbml` as the schema source of truth.
3. Preserve code-only constants that are not present in DBML; do not delete them automatically.
4. Keep DBML-backed entries in the exact table order from the DBML file.
5. Use `--write` to regenerate `collections.ts` by default.
6. Use `--dry-run` only when the user explicitly asks for a preview, comparison, or validation-only run.
