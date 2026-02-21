# Subscription System — Complete Flow Guide

This document explains how School Subscriptions, Student Code Generation, Code Redemption, and Parent Subscriptions work together.

---

## Overview

There are **two ways** a parent gets a subscription:

| Source | Who pays? | `subscription_source` | Price |
|--------|-----------|----------------------|-------|
| **Self-Pay** | Parent pays directly (Razorpay) | `self_pay` | Calculated based on plan |
| **School Redemption** | School pays in bulk, parent redeems a code | `school_redemption` | ₹0 (free for parent) |

Both paths result in a `ParentSubscription` record — the only difference is the source and price.

---

## Part 1: School Subscription (Admin Side)

### What is it?

A school purchases a bulk subscription that covers multiple students. The admin creates and manages it.

### Data Model — `SchoolSubscription`

| Field | Description |
|-------|-------------|
| `subscription_id` | Unique ID (prefix `SCHSUB`) |
| `school_id` | Which school this belongs to |
| `plan_id` | Which subscription plan |
| `subscription_status` | `active` / `expired` / `cancelled` |
| `start_date` / `end_date` | Validity period |
| `max_students` / `max_drivers` | Capacity limits |
| `auto_renew` | Whether it auto-renews |

### Status Transitions

```
  [Created] ──→ ACTIVE
                  │
          ┌───────┴───────┐
          ▼               ▼
       EXPIRED        CANCELLED
```

### Key Rules

- A school can only have **one active** subscription at a time
- Creating a subscription when one is already active returns a `409 Conflict`
- Admins can renew expired subscriptions or cancel active ones

### API Routes (Admin only)

| Method | Route | Action |
|--------|-------|--------|
| `POST /` | Create subscription |
| `GET /school/:schoolId` | List all for a school |
| `GET /school/:schoolId/active` | Get active subscription |
| `GET /:subscriptionId` | Get by ID |
| `PATCH /:subscriptionId` | Update details |
| `POST /:subscriptionId/renew` | Renew (set new end date, status → active) |
| `POST /:subscriptionId/cancel` | Cancel (status → cancelled, auto_renew → false) |
| `GET /expired/list` | List all expired subscriptions |

---

## Part 2: Student Code Generation (Admin Side)

### What is it?

Once a school has an active subscription, the admin generates **per-student redemption codes**. Each code is tied to a specific student and can be given to the student's parent to redeem.

### Data Model — `SchoolStudentCode`

| Field | Description |
|-------|-------------|
| `code_id` | Unique code identifier |
| `code` | The actual redemption code string (prefix `SCHSTDCD`) |
| `school_subscription_id` | Links back to the school subscription |
| `school_id` | Which school |
| `student_id` | Which specific student this code is for |
| `plan_id` | Which plan (inherited from school subscription) |
| `end_date` | Expiry (inherited from school subscription) |
| `is_redeemed` | `false` initially, `true` after parent redeems |
| `redeemed_by_parent_id` | Parent's MongoDB `_id` (set on redemption) |
| `redeemed_at` | Timestamp of redemption |

### How Generation Works

**API:** `POST /:subscriptionId/generate-codes`
**Input:** `{ student_ids: ["STU-xxx", "STU-yyy", ...] }`

**Steps:**

1. Validates the school subscription exists and is **ACTIVE**
2. For each student ID:
   - Checks if an **unredeemed** code already exists for this student + subscription combo
   - If yes → returns the existing code (no duplicate)
   - If no → generates a new unique code and saves it
3. Returns all created/existing codes

**Key Rule:** One student can only have **one unredeemed code** per school subscription. This prevents duplicate code generation.

### API Routes (Admin only)

| Method | Route | Action |
|--------|-------|--------|
| `POST /:subscriptionId/generate-codes` | Generate codes for students |
| `GET /:subscriptionId/codes` | List all codes for a subscription |

---

## Part 3: Code Redemption (Parent Side)

### What is it?

A parent receives a student code (e.g., from the school) and redeems it in the app. This creates a **free** `ParentSubscription`.

### How Redemption Works

**API:** `POST /api/v1/parent/subscriptions/redemption/redeem`
**Input:** `{ subscription_code: "SCHSTDCD-xxxxxx" }`
**Auth:** Parent JWT token

**Steps:**

1. **Resolve parent** — look up parent by JWT `userId`
2. **Find the code** — look up `SchoolStudentCode` by the code string
3. **Validate code:**
   - Code must exist → else `400 Invalid or expired code`
   - Code must NOT be already redeemed → else `400 Code already redeemed`
   - Code must NOT be expired (end_date >= now) → else `400 Invalid or expired code`
4. **Validate ownership** — the `student_id` on the code must belong to this parent's children → else `403`
5. **Check for conflicts** — the student must NOT already be in another active subscription → else `409`
6. **Check for existing redemption from same school subscription:**
   - **If parent already has an active redemption from the same school subscription** → adds the student to that existing subscription (`$addToSet` student, `$inc` number_of_kids)
   - **If no existing redemption** → creates a new `ParentSubscription` with:
     - `price = 0` (free)
     - `subscription_source = "school_redemption"`
     - `school_subscription_id` = linked school subscription
     - `auto_renew = false`
     - End date inherited from the student code
7. **Mark code as redeemed** — sets `is_redeemed = true`, records `redeemed_by_parent_id` and `redeemed_at`
8. **Update parent document** — sets `has_active_subscription = true`

### Example Scenario

```
School "ABC Academy" has active subscription SCHSUB-001
Admin generates codes for 3 students:
  - SCHSTDCD-AAA → Student STU-101 (Parent: Mom A)
  - SCHSTDCD-BBB → Student STU-102 (Parent: Mom A)  ← same parent!
  - SCHSTDCD-CCC → Student STU-103 (Parent: Dad B)

Mom A redeems SCHSTDCD-AAA:
  → New ParentSubscription created (source: school_redemption, price: ₹0)
  → student_ids: [STU-101]

Mom A redeems SCHSTDCD-BBB:
  → Same school subscription → STU-102 is ADDED to existing subscription
  → student_ids: [STU-101, STU-102], number_of_kids: 2

Dad B redeems SCHSTDCD-CCC:
  → New ParentSubscription created for Dad B
  → student_ids: [STU-103]
```

### Redemption API Routes (Parent auth)

| Method | Route | Action |
|--------|-------|--------|
| `POST /redeem` | Redeem a code |
| `GET /active` | Get active subscription |
| `GET /` | Get all subscriptions |
| `POST /cancel` | Cancel a subscription |
| `GET /status/check` | Check if parent has active subscription |
| `GET /:subscriptionId` | Get subscription details |
| `GET /available/codes` | See available (unredeemed) codes |

---

## Part 4: Parent Subscription (Self-Pay)

### What is it?

A parent can also subscribe directly by choosing a plan and paying. This is the **self-pay** path.

### Data Model — `ParentSubscription`

| Field | Description |
|-------|-------------|
| `subscription_id` | Unique ID (prefix `SUB`) |
| `parent_id` | Parent's MongoDB `_id` |
| `plan_id` | Chosen subscription plan |
| `student_ids` | Array of student IDs covered |
| `number_of_kids` | Count of students |
| `original_price` | Price before discounts |
| `calculated_price` | Final price after discounts |
| `discount_applied` | Discount details (type, percentage, amount, label) |
| `currency` | e.g., `INR` |
| `start_date` / `end_date` | Validity period |
| `subscription_status` | `active` / `expired` / `cancelled` / `upgraded` |
| `auto_renew` | Whether to auto-renew |
| `subscription_source` | `self_pay` or `school_redemption` |
| `school_subscription_id` | Set only for school redemptions |
| `upgraded_from_subscription_id` | Set when subscription was an upgrade |
| `prorated_amount` | Amount after proration credit (for upgrades) |

### Status Transitions

```
  [Created] ──→ ACTIVE
                  │
        ┌─────────┼─────────┐
        ▼         ▼         ▼
     EXPIRED  CANCELLED  UPGRADED
```

### How Self-Pay Create Works

**Steps:**

1. Resolve parent by `userId`
2. Check no existing active subscription → else `409`
3. Fetch and validate the plan
4. Auto-fetch parent's **active students**
5. Validate student count against plan's `kids.min` / `kids.max`
6. Check no student is already in another active subscription
7. Detect **same-trip groups** (students sharing driver + school)
8. Calculate price based on pricing model:
   - `FLAT` — fixed price regardless of kids
   - `PER_KID` — `per_kid_price × number_of_kids`
   - `BASE_PLUS_PER_KID` — `base_price + (per_kid_price × number_of_kids)`
9. Apply **same-trip discount** if qualifying kids exist
10. Calculate dates based on plan type (monthly / quarterly / yearly)
11. Create subscription record
12. Update parent document (`has_active_subscription = true`)

### How Upgrade Works

1. Must have an existing active subscription
2. Cannot upgrade to same plan
3. New plan must cost **more** than current (downgrades not allowed)
4. **Proration** is calculated:
   - `remaining_value = daily_rate × remaining_days` on current plan
   - `upgrade_price = new_plan_price - remaining_value`
5. Old subscription status → `UPGRADED`
6. New subscription created with `upgraded_from_subscription_id` link

### Recommendations Engine

`GET /recommendations` returns:
- Parent summary (kids, same-trip groups)
- Current subscription details (if any)
- Recommended plans with pricing + proration info
- Excluded plans (with reasons like "max kids exceeded")

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    ADMIN SIDE                           │
│                                                         │
│  1. Create School Subscription (for a school)           │
│         │                                               │
│         ▼                                               │
│  2. Generate Student Codes (per student)                │
│         │                                               │
│         ▼                                               │
│  3. Distribute codes to parents (offline/notification)  │
└─────────────────────┬───────────────────────────────────┘
                      │ code given to parent
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   PARENT SIDE                           │
│                                                         │
│  Path A: SCHOOL REDEMPTION                              │
│  ─────────────────────────                              │
│  4. Parent enters code → POST /redeem                   │
│  5. System validates code + student ownership           │
│  6. Creates ParentSubscription (price = ₹0)             │
│     OR adds student to existing redeemed subscription   │
│                                                         │
│  Path B: SELF-PAY                                       │
│  ────────────────                                       │
│  4. Parent views recommendations → GET /recommendations │
│  5. Parent selects plan → POST /create                  │
│  6. Price calculated (with discounts)                   │
│  7. Payment via Razorpay                                │
│  8. Creates ParentSubscription (calculated price)       │
│                                                         │
│  Either path → ParentSubscription (ACTIVE)              │
│  Parent can cancel, upgrade, or let it expire           │
└─────────────────────────────────────────────────────────┘
```

---

## Key Differences Summary

| Aspect | School Redemption | Self-Pay |
|--------|-------------------|----------|
| Who initiates? | Admin creates codes, parent redeems | Parent selects plan directly |
| Price | Always ₹0 | Calculated based on plan + kids |
| `subscription_source` | `school_redemption` | `self_pay` |
| `school_subscription_id` | Set (linked to school sub) | Not set |
| Auto-renew | Always `false` | Parent's choice |
| End date | Inherited from school subscription | Calculated from plan type |
| Multi-student | One code per student, added incrementally | All active students added at once |
| Discounts | N/A (free) | Same-trip discount may apply |
| Payment | None | Razorpay |
| Upgrade | Not supported | Supported with proration |
