# Module Placement

## Auto-Detection Steps (Phase 3)

1. Extract the entity name from the feature spec
2. Find the matching DBML table name in `spec/database/skolo.dbml`
3. Scan `src/modules/` to see if a parent domain folder already exists
4. Apply the decision tree below
5. State the determined placement in the plan — do not ask the user

If the placement seems ambiguous, state your reasoning in the plan. The user can correct it during the approval step.

---

## Decision Tree

```
Is the new entity a sub-concern of an existing domain in src/modules/?
│
├─ YES — and its routes naturally sit under that domain's prefix (e.g. /billing/...)
│         → SUBMODULE inside the existing parent folder
│
└─ NO  — it's its own top-level entity
          │
          ├─ Multiple related sub-entities that each have their own collection + route prefix?
          │   → NEW PARENT MODULE (create parent folder + submodule folders)
          │
          └─ Single entity, single concern
              → FLAT MODULE (single folder at src/modules/<name>/)
```

---

## Real Examples from This Codebase

| Module | Placement | Reason |
|--------|-----------|--------|
| `auth` | Flat — `src/modules/auth/` | Single entity, owns its own routes, no parent domain |
| `school` | Flat — `src/modules/school/` | Single entity, referenced by many but owned by none |
| `notification` | Flat — `src/modules/notification/` | Single concern, flat |
| `billing/subscription_plan` | Submodule — `src/modules/billing/subscription_plan/` | Sub-entity of the billing domain; routes sit under `/billing/` |
| `billing/payment` | Submodule — `src/modules/billing/payment/` | Same billing domain |
| `billing/razorpay` | Submodule — `src/modules/billing/razorpay/` | External integration scoped to billing |
| `users/parent` | Submodule — `src/modules/users/parent/` | User role sub-entity |
| `users/driver` | Submodule — `src/modules/users/driver/` | User role sub-entity |
| `trips/trip` | Submodule — `src/modules/trips/trip/` | Core trip entity within trips domain |
| `trips/trip_student` | Submodule — `src/modules/trips/trip_student/` | Trip sub-concern |
| `admin/admin_management` | Submodule — `src/modules/admin/admin_management/` | Admin-only sub-concern |

---

## Route Prefix Convention

A submodule's routes always sit under the parent domain's URL prefix:

- `billing/subscription_plan` → `/billing/subscription-plans` or `/subscription-plans` (check existing sibling routes)
- `users/parent` → `/users/profile` or `/profile`
- `trips/trip_student` → `/trip-students`

When determining the module path, verify how existing siblings are routed in `src/routes/` before proposing a URL prefix.
