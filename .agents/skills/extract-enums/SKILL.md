---
name: extract-enums
description: "Replace enum-like hard-coded values with shared enums from src/shared/constants/enums.ts. Use when reviewing or refactoring code that may contain hard-coded statuses, roles, types, modes, priorities, events, or workflow states. Infer scope from the current task, git diff, and nearby touched files when the user does not name files; then reuse shared enums first, extend matching enums when needed, create new shared enums only when no semantic match exists, migrate nearby module-local enums into shared enums, keep runtime string values unchanged, and keep shared enum declarations alphabetized."
---

# Extract Enums Skill

## Purpose

Replace enum-like hard-coded values with shared enums from `src/shared/constants/enums.ts` and keep the feature code aligned across interfaces, validation, services, controllers, and related files.

## How to Use This Skill

### Step 1: Discover scope automatically

Determine the refactor target before editing anything.

If the user names files or a feature, use that scope.

If the user does not name files, inspect the current repo state in this order:

- current task wording for feature clues
- staged and unstaged file changes
- recently touched files in the active feature area
- nearby files that share the same enum concept

Prioritize cohesive feature slices that contain enum-like literals in:

- interfaces and types
- Joi validation
- services
- controllers
- comparisons and switch cases

If multiple candidate areas appear, start with the smallest coherent feature set and expand only to nearby files that use the same concept.

If no changed files are relevant, search the repo for enum-like hard-coded values and choose the clearest constrained-set literals rather than broad free-form text.

If the user asks for a full repo sweep, do not stop at the first feature. Scan all relevant application source under `src`, work in coherent batches, and continue until the enum-worthy hard-coded values in scope have been handled.

For a full repo sweep, prioritize this order:

- module-local enums outside `src/shared/constants/enums.ts`
- Joi `.valid(...)` and similar validation literals
- constrained-set assignments and comparisons in services, controllers, repositories, and mappers
- string-typed interfaces or request types that should use existing shared enums

Skip generated artifacts, docs, and external snapshots unless the user explicitly includes them.

### Step 2: Start with a preview

Analyze the touched feature before editing anything.

For a full repo sweep, preview the planned batches before editing anything.

The preview should clearly separate:

- reused shared enum
- extended shared enum
- new shared enum
- migrated local enum

When doing a full repo sweep, also list the candidate feature batches you plan to process.

### Step 3: Check shared enums first

Open `src/shared/constants/enums.ts` and search for a semantic match before creating anything new.

Rules:

- reuse an existing shared enum when the concept already exists
- extend an existing shared enum when the concept matches but the needed value is missing
- create a new shared enum only when no suitable shared enum exists
- do not keep module-local enums as the final state

### Step 4: Refactor the relevant feature files

Update the touched feature and nearby related files that use the same concept, including:

- interfaces and types
- Joi validation
- services
- controllers
- comparisons and switch cases
- imports and shared exports

If the feature already contains local enums related to the same concept, migrate them into `src/shared/constants/enums.ts` and remove the local definitions.

When replacing literal comparisons or membership checks:

- prefer direct enum comparisons when the value may be optional or nullable
- only use `.includes(...)` with enum arrays when the checked value is already narrowed to the enum type
- do not add fallbacks like `?? ""` just to satisfy membership checks, because they can create TypeScript errors such as `"" | Enum`

### Step 5: Keep enum declarations ordered

After adding or moving shared enums, keep the top-level enum declarations in `src/shared/constants/enums.ts` sorted alphabetically by enum name.

### Step 6: Validate the refactor

Before finishing:

- re-scan the touched scope for the replaced literals
- confirm imports point to the shared enum source already used by the feature
- check that enum-based comparisons remain type-safe, especially around optional request fields and auth roles
- run targeted validation, tests, or lint when practical
- mention any ambiguous literals that were intentionally left alone

For a full repo sweep:

- repeat the scan after each batch until no clear enum-worthy candidates remain in the requested scope
- summarize any files or literal sets intentionally skipped and why

## What to Convert

Convert enum-like strings such as:

- roles
- statuses
- types
- priorities
- modes
- events
- workflow states

Do not convert:

- error messages
- route paths
- collection names
- IDs
- free-form labels or text

## Reference File

- `references/enum-rules.md` - decision rules and repo-specific examples

## AI Agent Instructions

When a user asks to clean up hard-coded enum-like values:

1. Infer scope from the user request, git diff, and nearby touched files when files are not specified.
   If the user asks for the whole repo, scan all relevant application source under `src` instead of narrowing to one feature.
2. Preview the intended refactor before editing files.
3. Search `src/shared/constants/enums.ts` first.
4. Reuse shared enums before extending or creating anything.
5. Never introduce a new module-local enum.
6. Migrate nearby touched local enums into shared enums.
7. Replace hard-coded usage in the relevant feature files with enum members.
8. Keep runtime string values unchanged.
9. Keep shared enum declarations alphabetized by enum name.
10. Keep enum comparisons type-safe by narrowing optional values before membership checks.
11. Validate the touched scope before finishing.
