# Enum Rules

Use this reference when applying the `extract-enums` skill.

## Core Rules

1. If the user does not specify files, infer scope from the current task, `git diff`, and nearby touched files before performing a broader search.
   If the user asks for a whole-repo pass, scan all relevant application source under `src` and process candidates in batches until the requested sweep is complete.
2. Treat `src/shared/constants/enums.ts` as the single source of truth for shared enum concepts.
3. Search for an existing shared enum before creating a new enum.
4. If the concept already exists, add a new enum member instead of creating a duplicate enum.
5. Do not leave module-local enums behind when the touched feature is being refactored.
6. Keep serialized values exactly the same as the original hard-coded literals.
7. Keep top-level enum declarations in `src/shared/constants/enums.ts` sorted alphabetically by enum name.
8. When converting comparisons or role/status checks, do not introduce `?? ""` or similar fallback hacks to satisfy enum arrays; narrow the value first or compare enum members directly.

## Refactor Targets

Check these places for enum-like hard-coded values:

- interface and type fields
- Joi `.valid(...)` lists
- service-layer assignments
- controller branching
- `if` / `switch` comparisons
- mapper and transformer code
- repository filters and query predicates

## Full Repo Sweep

When the user asks for a full repo cleanup:

1. Search all relevant files under `src`.
2. Exclude generated docs, snapshots, and similar derived artifacts unless requested.
3. Group findings into coherent feature batches instead of editing unrelated files in random order.
4. Prefer finishing one batch completely before moving to the next.
5. After each batch, re-scan the repo for remaining enum-worthy candidates.

## Preferred Refactor Pattern

1. Determine the target scope from user-provided files or, if absent, from `git diff` and nearby touched files.
   For whole-repo requests, use all relevant `src` files as scope and process them in batches.
2. Search `src/shared/constants/enums.ts`.
3. Choose one of:
   - reuse existing shared enum
   - extend existing shared enum
   - create new shared enum
   - migrate nearby local enum into shared
4. Update imports through `@shared/constants` or `@shared/constants/enums` based on the existing file pattern.
5. Replace direct literals with enum members.
6. Update validation to use `Object.values(Enum)` or explicit enum members where clearer.
7. For optional values, prefer direct enum comparisons or explicit narrowing instead of `.includes(value ?? "")`.
8. Remove migrated local enum definitions from feature files.
9. Re-scan the touched scope for remaining literals and run targeted validation when practical.

## Repo Examples

### Reuse existing shared enums

- `UserRole` for role values like `admin`, `superadmin`, `school_admin`, `parent`, `driver`
- `SchoolSubscriptionStatus` for `active`, `expired`, `cancelled`, `pending`
- `DeviceType` for `android`, `ios`, `web`
- `TripType`, `TripStatus`, `AssignmentStatus`, `PaymentStatus`, and similar existing status/type enums

### Extend existing shared enums

If a task introduces a new role-like literal and the meaning belongs under `UserRole`, add the new member to `UserRole` instead of creating another role enum.

### Migrate touched local enums into shared

Current module-local enums worth migrating when their feature is touched:

- `DriverOnboardingScreen` in `src/modules/users/driver/driver.type.ts`

### Replace hard-coded validation literals

Current examples of hard-coded enum-worthy literals:

- `src/modules/billing/school_subscription/school_subscription.validation.ts`
- `src/modules/googlemaps/googlemaps.validation.ts`
- repo-wide status/type assignments and filters that still use raw literals even though a shared enum already exists

Use shared enums when the concept is stable and reused or likely to be reused.

### Type-safe enum checks

Prefer:

- `role === UserRole.ADMIN || role === UserRole.SUPERADMIN`
- `if (status && allowedStatuses.includes(status))`

Avoid:

- `allowedStatuses.includes(role ?? "")`
- any fallback that widens the checked value to `"" | Enum` or a similar mixed type

## Do Not Convert

Do not turn these into enums unless the task explicitly requires it:

- human-readable validation messages
- endpoint paths
- collection names
- ad hoc prose strings
- one-off values that are not part of a constrained set
