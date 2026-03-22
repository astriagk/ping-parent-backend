---
name: gen-feature-spec
description: "Generate spec/features/<feature>.md for any module by reading its source files and extracting endpoints, flows, external services, and key rules. Supports standalone modules (e.g. auth) and submodules (e.g. billing/razorpay, users/parent). Output follows the structure of spec/features/auth.md."
user-invocable: true
---

# Gen Feature Spec Skill

## Purpose

Read a module's source files and generate a minimal `spec/features/<feature>.md` that captures what the feature does, how its flows work, what external services it uses, and what the key business rules are.

The spec file becomes the living source of truth for that feature. When logic needs to change (e.g. swap Twilio for a different OTP provider), update the spec doc and ask the agent to update the code accordingly.

## Reference Example

`spec/features/auth.md` — use this as the exact style and structure guide for every generated file.

## How to Use

Tell the AI the feature name:

```
gen-feature-spec auth
gen-feature-spec billing/razorpay
gen-feature-spec users/parent
gen-feature-spec trips/trip-student
```

## Agent Instructions

### Step 1: Parse the feature input

Accept the feature name as provided (e.g. `auth`, `billing/razorpay`, `users/parent`).

### Step 2: Resolve the module path

Map the feature name to its source folder:

- `auth` → `src/modules/auth/`
- `billing/razorpay` → `src/modules/billing/razorpay/`
- `users/parent` → `src/modules/users/parent/`
- `trips/trip-student` → `src/modules/trips/trip_student/` (note: folder names may use underscores)

If the folder does not exist, check for underscore variants (e.g. `trip-student` → `trip_student`).

### Step 3: Read all files in the module folder

Read every file in the resolved folder:

- `*.routes.ts` — endpoint definitions and middleware
- `*.controller.ts` — request handlers and business flow
- `*.service.ts` — business logic and external service calls
- `*.repository.ts` — data access patterns
- `*.type.ts` — data shapes and interfaces
- `*.validation.ts` — input validation rules

### Step 4: Determine the output path

- Feature with no `/` → `spec/features/<feature>.md`
- Feature with `/` → `spec/features/<parent>/<submodule>.md`

Examples:

- `auth` → `spec/features/auth.md`
- `billing/razorpay` → `spec/features/billing/razorpay.md`
- `users/parent` → `spec/features/users/parent.md`

### Step 5: Extract from the source code

**Endpoints** (from `*.routes.ts`):

- HTTP method, path, auth/middleware requirement, and what the handler does

**Flows** (from `*.controller.ts`):

- Group handlers by logical action (e.g. Create, Update, Delete, List)
- For each flow, extract numbered steps: validation → lookup → business logic → response
- Keep each step to one line

**External Services** (from `*.service.ts` imports):

- What library/service is used, what methods are called, which file to edit to swap it

**Key Rules** (from `*.service.ts` and `*.controller.ts`):

- Business invariants, constraints, access rules, soft-delete patterns, defaults

### Step 6: Write the spec file

Follow the exact section structure of `spec/features/auth.md`:

```
# <Feature Name>

## Overview
<one paragraph>

## Endpoints
| Method | Path | Auth | Purpose |

## Flow: <Name>
1. ...

## External Services
| Service | Used For | File | How to Swap |

## Key Rules
- ...
```

Keep each flow to numbered steps only — no prose paragraphs. Keep the whole file under 80 lines.
