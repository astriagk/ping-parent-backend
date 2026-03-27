---
name: gen-product-spec
description: "Generate a spec/product-logic/<feature>.md from a natural language description. Reads DBML + existing modules, asks targeted questions, then produces an impl-feature-ready product spec."
user-invocable: true
---

# gen-product-spec

Turns a natural language feature description into a `spec/product-logic/<feature>.md` ready for `/impl-feature`.
Reads the DBML schema and existing modules to minimise clarifying questions.

---

## Usage

```
gen-product-spec "login, register, OTP for users"
gen-product-spec "school event notifications" spec/product-logic/notifications/school_events.md
gen-product-spec "driver reviews" spec/product-logic/reviews.md
```

First argument: natural language description of the feature.
Second argument *(optional)*: explicit output path. If omitted, the path is derived from the description.

---

## Phases

| # | Action | Reference |
|---|--------|-----------|
| 1 | Parse the description and optional output path hint from the user | — |
| 2 | Read `spec/database/skolo.dbml` — extract table names, fields, and `is_active` presence | — |
| 3 | Scan `src/modules/` directory — detect whether this is a new or existing feature | — |
| 4 | Read `src/shared/constants/enums.ts` — note existing enums relevant to the domain | — |
| 5 | Determine output path: use hint if given; else derive `spec/product-logic/<feature>.md` from description | — |
| 6 | Identify unanswerable questions → ask ALL in ONE numbered list → wait for answers | [clarifying-questions.md](references/clarifying-questions.md) |
| 7 | Write the complete `spec/product-logic/<feature>.md` | [product-logic-format.md](references/product-logic-format.md) |
| 8 | Tell user: `Run /impl-feature <output-path> to implement this feature.` | — |

---

## Never Ask the User About

- File naming, module folder names, or import paths (not relevant at this stage)
- Enum value spellings in detail (impl-feature confirms these in its Phase 5)
- Error or success message wording (impl-feature handles that)
- Which auth middleware class to use (impl-feature auto-determines from roles)

---

## Questions to Ask (Phase 6) — Only If Not Inferable

1. Which actor(s) per endpoint group? (`parent`, `driver`, `school_admin`, `admin`)
2. Auth level per group — `None`, `Bearer`, or `Admin`?
3. External services needed? (OTP/Twilio, push/FCM, payments/Razorpay, maps/Google)
4. Soft-delete or hard-delete for removable records? (skip if DBML table has `is_active`)
5. Pagination needed for list endpoints?
6. Any fields not obvious from description or DBML?
7. New collections not present in DBML?
