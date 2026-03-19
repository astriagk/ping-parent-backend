#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const repoRoot = process.cwd();
const defaultSource = path.join(repoRoot, "database", "skolo.dbml");
const collectionsFile = path.join(
  repoRoot,
  "src",
  "shared",
  "constants",
  "collections.ts",
);

function parseArgs(argv) {
  const args = {
    source: defaultSource,
    dryRun: false,
    write: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run") {
      args.dryRun = true;
      continue;
    }

    if (arg === "--write") {
      args.write = true;
      continue;
    }

    if (arg === "--source") {
      const nextValue = argv[index + 1];
      if (!nextValue) {
        throw new Error("Missing value for --source");
      }
      args.source = path.resolve(repoRoot, nextValue);
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (args.dryRun && args.write) {
    throw new Error("Use either --dry-run or --write, not both");
  }

  if (!args.dryRun && !args.write) {
    args.dryRun = true;
  }

  return args;
}

function readFileOrThrow(filePath, label) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${path.relative(repoRoot, filePath)}`);
  }

  return fs.readFileSync(filePath, "utf8");
}

function parseDbmlTables(content) {
  const tableRegex = /^Table\s+([A-Za-z0-9_]+)\s*\{/gm;
  const tables = [];
  const seen = new Set();
  let match;

  while ((match = tableRegex.exec(content)) !== null) {
    const tableName = match[1];
    if (seen.has(tableName)) {
      continue;
    }

    seen.add(tableName);
    tables.push(tableName);
  }

  if (tables.length === 0) {
    throw new Error(
      "No DBML tables found. Expected lines like `Table users {` in the source file.",
    );
  }

  return tables;
}

function parseCollectionsFile(content) {
  const objectMatch = content.match(/export const COLLECTIONS = \{([\s\S]*?)\};/);

  if (!objectMatch) {
    throw new Error("Could not find `export const COLLECTIONS = { ... };`");
  }

  const collectionRegex = /^\s*([A-Z0-9_]+):\s*"([^"]+)",/gm;
  const entries = [];
  let match;

  while ((match = collectionRegex.exec(objectMatch[1])) !== null) {
    entries.push({
      key: match[1],
      value: match[2],
    });
  }

  if (entries.length === 0) {
    throw new Error("No collection entries found in `COLLECTIONS`");
  }

  const aliasRegex =
    /export const ([A-Z0-9_]+)_COLLECTION\s*=\s*COLLECTIONS\.([A-Z0-9_]+);/gm;
  const aliasKeys = [];

  while ((match = aliasRegex.exec(content)) !== null) {
    aliasKeys.push({
      exportKey: match[1],
      collectionKey: match[2],
    });
  }

  return {
    entries,
    aliasKeys,
  };
}

function toConstantKey(name) {
  return name
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .toUpperCase();
}

function wrapAliasExport(key) {
  const line = `export const ${key}_COLLECTION = COLLECTIONS.${key};`;
  if (line.length <= 80) {
    return line;
  }

  return `export const ${key}_COLLECTION =\n  COLLECTIONS.${key};`;
}

function buildFinalEntries(tableNames, currentEntries) {
  const currentByKey = new Map(currentEntries.map((entry) => [entry.key, entry]));
  const dbmlKeySet = new Set();
  const finalEntries = [];
  const addedFromDbml = [];
  const updatedFromDbml = [];
  const unchanged = [];

  for (const tableName of tableNames) {
    const key = toConstantKey(tableName);
    const entry = {
      key,
      value: tableName,
      source: "dbml",
    };

    dbmlKeySet.add(key);
    finalEntries.push(entry);

    const currentEntry = currentByKey.get(key);

    if (!currentEntry) {
      addedFromDbml.push(entry);
      continue;
    }

    if (currentEntry.value !== tableName) {
      updatedFromDbml.push({
        key,
        from: currentEntry.value,
        to: tableName,
      });
      continue;
    }

    unchanged.push(entry);
  }

  const preservedCodeOnly = currentEntries
    .filter((entry) => !dbmlKeySet.has(entry.key))
    .map((entry) => ({
      ...entry,
      source: "preserved",
    }));

  finalEntries.push(...preservedCodeOnly);

  return {
    finalEntries,
    addedFromDbml,
    updatedFromDbml,
    preservedCodeOnly,
    unchanged,
  };
}

function renderCollectionsFile(entries) {
  const collectionLines = entries.map(
    (entry) => `  ${entry.key}: "${entry.value}",`,
  );
  const aliasLines = entries.map((entry) => wrapAliasExport(entry.key));

  return `${[
    "export const COLLECTIONS = {",
    ...collectionLines,
    "};",
    "",
    ...aliasLines,
    "",
  ].join("\n")}`;
}

function relativePath(filePath) {
  return path.relative(repoRoot, filePath).replace(/\\/g, "/");
}

function formatList(items, formatter) {
  if (items.length === 0) {
    return "  - none";
  }

  return items.map((item) => `  - ${formatter(item)}`).join("\n");
}

function printSummary(mode, sourcePath, result) {
  console.log(`Mode: ${mode}`);
  console.log(`Source: ${relativePath(sourcePath)}`);
  console.log(`Target: ${relativePath(collectionsFile)}`);
  console.log("");
  console.log(`Added from DBML (${result.addedFromDbml.length}):`);
  console.log(formatList(result.addedFromDbml, (item) => `${item.key} -> ${item.value}`));
  console.log("");
  console.log(`Updated from DBML (${result.updatedFromDbml.length}):`);
  console.log(
    formatList(
      result.updatedFromDbml,
      (item) => `${item.key}: "${item.from}" -> "${item.to}"`,
    ),
  );
  console.log("");
  console.log(`Preserved code-only entries (${result.preservedCodeOnly.length}):`);
  console.log(
    formatList(
      result.preservedCodeOnly,
      (item) => `${item.key} -> ${item.value}`,
    ),
  );
  console.log("");
  console.log(`Unchanged entries (${result.unchanged.length})`);
  console.log("");
  console.log("Final order:");
  console.log(
    result.finalEntries
      .map(
        (entry, index) =>
          `  ${String(index + 1).padStart(2, "0")}. [${entry.source}] ${entry.key} -> ${entry.value}`,
      )
      .join("\n"),
  );
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dbmlContent = readFileOrThrow(args.source, "DBML source");
  const collectionsContent = readFileOrThrow(collectionsFile, "Collections file");
  const tableNames = parseDbmlTables(dbmlContent);
  const { entries, aliasKeys } = parseCollectionsFile(collectionsContent);

  if (aliasKeys.length === 0) {
    throw new Error("No `*_COLLECTION` exports found in collections.ts");
  }

  const result = buildFinalEntries(tableNames, entries);
  const output = renderCollectionsFile(result.finalEntries);

  if (args.write) {
    fs.writeFileSync(collectionsFile, output, "utf8");
  }

  printSummary(args.write ? "write" : "dry-run", args.source, result);

  if (args.write) {
    console.log("");
    console.log(`Wrote ${relativePath(collectionsFile)}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`sync-collections failed: ${error.message}`);
  process.exit(1);
}
