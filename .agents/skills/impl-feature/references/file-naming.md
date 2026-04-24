# File Naming & Module Structure

## The 7-File Module Pattern

Every module (flat or submodule) contains these files:

| File | Owns |
|------|------|
| `<module>.type.ts` | TypeScript interfaces for the domain — one interface per DBML table the module owns |
| `<module>.validation.ts` | Joi schemas for request body validation |
| `<module>.repository.ts` | DB queries only — extends BaseRepository, no business logic |
| `<module>.service.ts` | Business logic — standalone exported functions, no HTTP concerns |
| `<module>.controller.ts` | HTTP handlers — thin, calls service, returns response |
| `<module>.routes.ts` | Handler-group export object — no routing, no auth middleware |
| `index.ts` | Barrel re-exports |

## Naming Rules

- Use `.controller.ts` — NOT `.handler.ts`
- Use `.type.ts` — NOT `.types.ts`
- Module folder name uses `snake_case` matching the DBML table name (e.g., `subscription_plan`, `school_events`)
- File prefix matches folder name exactly

## Optional Extra Files

Add these only when the feature requires it:

| File | When to Add |
|------|-------------|
| `<module>.cron.ts` | Feature needs a scheduled background job |
| `<module>.data-mapper.ts` | Feature calls an external API whose response needs transformation |

Register cron jobs in `src/server.ts` at startup. Reference: `src/modules/billing/parent_subscription/parent_subscription.cron.ts`.

## Barrel Export Rules (`index.ts`)

**Include:**
- `export * from "./<module>.controller"`
- `export * from "./<module>.validation"`
- `export * from "./<module>.repository"`
- `export * from "./<module>.type"`

**Exclude:**
- `.service.ts` — internal implementation detail
- `.routes.ts` — handler group is consumed directly by `src/routes/`, not via barrel

## Module Location

```
src/modules/
├── <flat-module>/               ← single entity, stands alone
│   └── [7 files]
│
└── <parent-module>/             ← domain with multiple sub-entities
    ├── <submodule-a>/
    │   └── [7 files]
    └── <submodule-b>/
        └── [7 files]
```

See [module-placement.md](module-placement.md) for the decision tree.
