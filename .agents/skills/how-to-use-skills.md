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
- `extract-enums`
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

---

## Skill: Extract Enums

Folder: `.agents/skills/extract-enums`

### Purpose

Replace enum-like hard-coded values with shared enums from `src/shared/constants/enums.ts`.

### When To Use

Use this skill when:

- you see hard-coded roles, statuses, types, priorities, modes, events, or workflow strings
- you need to reuse an existing enum like `UserRole`
- you need to add a new enum member to an existing shared enum
- a touched feature still has module-local enums that should be moved into shared enums

### How To Use

Start with a preview:

```text
Use extract-enums to review this feature and show which values should reuse, extend, create, or migrate shared enums.
```

Then apply the refactor after review.

The skill will:

- inspect `src/shared/constants/enums.ts` first
- reuse existing shared enums when possible
- extend existing shared enums when the concept matches
- create a new shared enum only when needed
- migrate nearby local enums into shared enums
- keep shared enum declarations sorted alphabetically by enum name

Default behavior for this skill:

- preview first before editing
- do not create new module-local enums
- update related types, validation, services, controllers, and imports in the touched feature

### Important Files

- `.agents/skills/extract-enums/SKILL.md`
- `.agents/skills/extract-enums/references/enum-rules.md`
- `src/shared/constants/enums.ts`
- `src/shared/constants/index.ts`
---

## Skill: Centralize Messages

Folder: `.agents/skills/centralize-messages`

### Purpose

Auto-scan the codebase for hard-coded or duplicated user-facing messages and centralize them into shared constants/templates while keeping public exports stable.

### When To Use

Use this skill whenever you touch modules that add or change API/notification/middleware messages, or when you want a repo-wide sweep for message dedupe.

### How To Use

Simply invoke the skill; it defaults to a full `src` scan, previews findings, then applies the refactor in the same session -- no helper script required.

Optional scope hint (narrow to a feature): `--scope src/modules/users`.

### Important Files

- `.agents/skills/centralize-messages/SKILL.md`
- `src/shared/constants/messages.ts`
- `src/shared/constants/validationMessages.ts`
- `src/shared/constants/messageTemplates.ts`
- `src/shared/constants/index.ts`
