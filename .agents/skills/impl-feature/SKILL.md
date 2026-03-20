---
name: impl-feature
description: "Implement a backend feature end-to-end from a spec MD file: reads architecture + DBML, asks targeted questions, plans, implements all module files, and auto-generates the feature spec via gen-feature-spec."
user-invocable: true
---

# impl-feature

Implements a complete backend feature from a spec MD file the user provides. Reads architecture and database context, identifies gaps, plans every file, waits for approval, then writes all code and auto-updates the spec.

## Usage

```
impl-feature product-logic/school_events.md
impl-feature product-logic/billing/school_subscription.md
impl-feature product-logic/ads.md
```

The argument is the path to the user's feature logic MD file. Paths are relative to the project root.

---

## Phases

| # | Action | Reference |
|---|--------|-----------|
| 1 | Read `spec/docs/Architecture.md` and `spec/database/skolo.dbml` | — |
| 2 | Resolve and read the provided feature logic MD file | — |
| 3 | Auto-determine module placement from DBML table names + `src/modules/` directory scan | [module-placement.md](references/module-placement.md) |
| 4 | Read `src/shared/constants/enums.ts`, `messages.ts`, `validationMessages.ts`, `collections.ts` | [shared-constants.md](references/shared-constants.md) |
| 5 | Ask ALL remaining ambiguous questions in ONE numbered list — then wait for answers | — |
| 6 | Generate a complete file-level plan listing every file to create and every file to modify with exact paths — then wait for approval | [file-naming.md](references/file-naming.md) |
| 7 | Incorporate any feedback and re-present the plan — wait for approval before writing | — |
| 8 | Pre-implementation: scan for existing files; read reference files for patterns | [coding-patterns.md](references/coding-patterns.md) |
| 9 | Implement all module files + shared constant additions + route wiring | [coding-patterns.md](references/coding-patterns.md) · [adding-new-things.md](references/adding-new-things.md) |
| 10 | Post-scan: verify no hardcoded strings, correct `@shared/` aliases, every controller uses `asyncHandler`, barrel exports match | — |
| 11 | Auto-invoke `/gen-feature-spec <module-path>` and report all created/modified files | — |

---

## Never Ask the User About

- Module placement (auto-determined in Phase 3)
- File naming conventions (defined in references)
- Import path aliases (`@shared/`, `@modules/`)
- Which auth middleware to use or where to put it
- Collection constant names (derived from DBML)

---

## Questions to Ask (Phase 5) — Only If Not Answerable from the Spec

1. External service needed but not named (OTP, push notifications, payments, routing)
2. Dev/test environment bypass for OTP or payment flows
3. Soft-delete vs. hard-delete — only if DBML table has no `is_active` and the spec is silent
4. Pagination strategy for list endpoints — only if not specified
5. Which role gateway(s) each endpoint belongs to — only if not stated
6. New enum values not yet in `enums.ts` — confirm exact values/wording before creating
7. New error or success message wording not in `messages.ts` — confirm before creating
