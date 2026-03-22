---
name: centralize-messages
description: "Auto-scan the codebase for hard-coded or duplicated user-facing messages, then centralize them into shared message constants and templates while keeping the public exports stable."
user-invocable: true
---

# Centralize Messages Skill

## Purpose

Provide a one-shot workflow to find and refactor user-facing messages across the backend without requiring a helper script. The skill drives Codex to scan, preview, and then apply changes within the same session while preserving public exports (`ERROR_MESSAGES`, `SUCCESS_MESSAGES`, `VALIDATION_MESSAGES`) and introducing `MESSAGE_TEMPLATES` for dynamic text.

## Default Behavior

- Scope: full `src` tree unless the user narrows it (e.g., `--scope src/modules/users`).
- Mode: preview findings first, then apply edits in the same session.
- In scope: API responses, middleware responses, notifications/socket payloads, thrown operational errors that surface to clients, success messages, runtime validation feedback.
- Out of scope: enums/constants like routes/IDs/keys, collection names, comments, server-only logs that are not user-facing.
- Dedupe policy: promote exact runtime duplicates to `ERROR_MESSAGES.COMMON` or `SUCCESS_MESSAGES_COMMON` where applicable; keep validation text separate even if wording matches runtime.
- Dynamic text policy: convert interpolated strings (names, counts, URLs, ETA, paths) into `MESSAGE_TEMPLATES` helpers instead of repeating inline templates.

## Workflow

1. **Baseline scan (rg-driven):**
   - Search likely message literals with ripgrep across `src`:
     - `rg -n "new ApiError\(|throw new Error\(" src`
     - `rg -n "message:\s*\"|error:\s*\"|reason:\s*\"|success:\s*\"" src`
     - `rg -n "SUCCESS_MESSAGES|ERROR_MESSAGES|VALIDATION_MESSAGES" src`
   - Include template literals by also checking ``rg -n "`[^`]*\${" src``.
   - Ignore `node_modules`, `dist`, `build`, `coverage`, `.agents`.

2. **Classify findings:** For each literal, decide one bucket:
   - `reuse`: already exists in shared constants → replace inline usage.
   - `promote common`: exact duplicate runtime text → move to `COMMON` section.
   - `module static`: add to the relevant module block under messages.
   - `validation`: when in `validationMessages.ts` or Joi schemas, keep within validation scope; may dedupe identical validation strings into `VALIDATION_MESSAGES.<MODULE>` but **never** replace runtime messages with validation ones or vice‑versa.
   - `template`: contains variables → add to `MESSAGE_TEMPLATES` with typed params.
   - `skip`: non-user-facing or identifier-like string.

3. **Update shared surfaces (keep public API):**
   - `src/shared/constants/messages.ts`: remain the main export surface; optionally re-export module-split files if they exist.
   - `src/shared/constants/validationMessages.ts`: dedupe repeated validation strings inside the appropriate module blocks; add module COMMON buckets if many repeats; ensure keys remain stable.
   - `src/shared/constants/messageTemplates.ts`: add `export const MESSAGE_TEMPLATES = { ... } as const;` and organize by module.
   - `src/shared/constants/index.ts`: export `MESSAGE_TEMPLATES` alongside existing exports.

4. **Refactor call sites:**
   - Replace inline strings with the appropriate shared constant or template call.
   - For templates, add small helper functions in `messageTemplates.ts` (pure, synchronous, return string). Keep names mirroring modules/keys.
   - Ensure imports point to `@shared/constants` to preserve path consistency.

5. **Preview before apply:**
   - Summarize planned edits by category (reuse/promo/template/validation) and affected files.
   - Call out any ambiguous strings you intend to skip.

6. **Apply changes:**
   - Edit shared constants, templates, and call sites per the preview.
   - Keep runtime string values unchanged when moving them.
   - Do not merge validation text into runtime text; for validation dedupe, only reuse within `VALIDATION_MESSAGES`.

7. **Post-check:**
   - Re-run the `rg` scans on touched scope to ensure no obvious hard-coded messages remain.
   - If time permits, run lint or targeted tests; otherwise note that tests were not run.

## Notes

- Prefer module grouping that mirrors existing message blocks (AUTH, DRIVER, TRIP, etc.).
- Keep additions alphabetized within each block when practical.
- For new templates, use straightforward parameter names and return strings only; no side effects.
- Avoid expanding scope to logs or config errors unless they surface to clients.
- Default to full sweep when scope is unspecified; narrow only on explicit user request.
