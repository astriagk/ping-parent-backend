# Subscription Plan

## Overview

Admin-managed catalog of subscription plans that parents can purchase. Each plan defines pricing, kid-count limits, features, and display metadata (badge, priority). Plans can be activated or deactivated without deletion. Public endpoints expose active plans to clients; all mutations are admin-only.

---

## Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/subscription-plans` | None | List all active plans sorted by priority |
| GET | `/api/subscription-plans/:id` | None | Get a single plan by ID |
| POST | `/api/subscription-plans` | Admin | Create a new subscription plan |
| PUT | `/api/subscription-plans/:id` | Admin | Update plan fields |
| PATCH | `/api/subscription-plans/:id/activate` | Admin | Set `is_active: true` |
| PATCH | `/api/subscription-plans/:id/deactivate` | Admin | Set `is_active: false` |

---

## Flow: Create Plan

1. Admin sends plan body (name, type, price, currency, kids limits, pricing model, features, optional badge/discounts)
2. Validate via `createSubscriptionPlanSchema` — all required fields checked
3. Service sets `is_active: true`, `created_at: now`, `updated_at: now`
4. Insert into `subscription_plans` collection
5. Return `201 CREATED` with new plan document

## Flow: Get Active Plans

1. Query `subscription_plans` where `is_active: true`, sorted by `priority ASC`
2. Return array of plans

## Flow: Get Plan by ID

1. Look up plan by `_id`
2. If not found → `404 NOT_FOUND`
3. Return plan document

## Flow: Update Plan

1. Admin sends partial update body (all fields optional)
2. Validate via `updateSubscriptionPlanSchema`
3. Apply `$set` with updates + `updated_at: now`
4. If not found → `404 NOT_FOUND`
5. Return updated plan document

## Flow: Activate / Deactivate Plan

1. Extract `id` from route params
2. Apply `$set: { is_active: true/false, updated_at: now }`
3. If not found → `404 NOT_FOUND`
4. Return updated plan with success message

---

## External Services

| Service | Used For | File | How to Swap |
|---------|----------|------|-------------|
| MongoDB | Persist and query plans | `subscription_plan.repository.ts` | Extend `BaseRepository`; replace `findActivePlans()` / `findByPlanId()` implementations |

---

## Key Rules

- Plans are never hard-deleted — use activate/deactivate to control visibility
- `getAllSubscriptionPlans` returns only `is_active: true` plans, sorted by `priority ASC`
- `per_kid_price` is required when `pricing_model` is not `FLAT`; nullable when `FLAT`
- Kids `min` must not exceed `max` (custom Joi validation)
- `currency` must be exactly 3 uppercase characters
- `plan_name` must be 3–100 characters
- `priority` defaults to `0`; lower number = higher display order
- `badge` is optional and nullable; used for display labels (e.g. "Most Popular")
- `discounts.same_trip` supports a percentage discount for multiple kids on the same trip
