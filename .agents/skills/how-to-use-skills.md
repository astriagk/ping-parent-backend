# How To Use Skills

This file is the shared guide for all skills inside `.agents/skills`.

Use this document when you want to:

- understand what each skill does
- know when to use a skill
- find the command or workflow for a skill
- keep adding notes for new skills in one place

## How This Folder Is Organized

Each skill lives in its own folder inside `.agents/skills`.

Skill folder names should always use `kebab-case`.

Examples:

- `commit-message`
- `sync-collections`
- `generate-api-docs`

Current skills:

- `commit-message`
- `sync-collections`

Each skill folder can contain:

- `SKILL.md` - the main instructions for the skill
- helper files like scripts, assets, or references

## How To Add Future Skills To This File

When a new skill is created, add a new section here using the same format:

1. Skill name
2. Purpose
3. When to use it
4. How to run or use it
5. Important files

Naming rule for new skills:

- use `kebab-case` for the folder name
- keep the name short and clear
- prefer action-based names like `sync-collections` or `commit-message`

This keeps one easy-to-read file for the whole team.

---

## Skill: Commit Message

Folder: `.agents/skills/commit-message`

### Purpose

Generate standardized commit messages in this format:

```text
type (scope) : description
```

### When To Use

Use this skill when you want help writing a commit message for code, docs, fixes, refactors, or maintenance changes.

### How To Use

Tell the AI what changed.

Example:

```text
Create a commit message for adding JWT refresh token support
```

The skill will:

- identify the correct commit type
- choose a scope
- generate the final commit message

### Important Files

- `.agents/skills/commit-message/SKILL.md`
- `.agents/skills/commit-message/commit-message.md`

---

## Skill: Sync Collections

Folder: `.agents/skills/sync-collections`

### Purpose

Sync `src/shared/constants/collections.ts` using the table names from `database/skolo.dbml`.

### When To Use

Use this skill when:

- a new table is added to `skolo.dbml`
- collection constants are outdated
- `collections.ts` needs to be reordered to match the DBML schema

### How To Use

Apply the sync directly:

```bash
node .agents/skills/sync-collections/scripts/sync-collections.js --write
```

Use dry-run only if you want a preview before rewriting the file:

```bash
node .agents/skills/sync-collections/scripts/sync-collections.js --dry-run
```

Optional custom source file:

```bash
node .agents/skills/sync-collections/scripts/sync-collections.js --write --source database/skolo.dbml
```

The script will:

- read table names from `database/skolo.dbml`
- reorder DBML-backed collection constants to match the DBML file
- preserve legacy code-only constants at the end
- regenerate all `*_COLLECTION` exports

Default behavior for this skill:

- do not ask follow-up questions if the default files are available
- update the target file directly
- use preview mode only when explicitly requested

### Important Files

- `.agents/skills/sync-collections/SKILL.md`
- `.agents/skills/sync-collections/scripts/sync-collections.js`
- `database/skolo.dbml`
- `src/shared/constants/collections.ts`
