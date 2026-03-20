# Coding Patterns

Reference: `src/modules/billing/subscription_plan/` is the canonical simple CRUD module. For complex patterns, reference the modules noted per section.

---

## Types (`<module>.type.ts`)

- One `interface` per DBML table the module owns
- Field names match DBML column names exactly (snake_case)
- Use `any` for `_id` and ObjectId reference fields
- Import enums from `@shared/constants`, not locally

```ts
import { SomeEnum } from "@shared/constants";

export interface FeatureName {
  _id: any;
  parent_id: any;
  status: SomeEnum;
  name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

---

## Validation (`<module>.validation.ts`)

- Joi schemas; one schema per request body
- Import `Joi` from `"joi"`
- Import field error strings from `@shared/constants` (`VALIDATION_MESSAGES.<MODULE>`)
- Export each schema as a named const: `export const createFeatureSchema = Joi.object({ ... })`

---

## Repository (`<module>.repository.ts`)

- Class extends `BaseRepository<FeatureName>` from `@shared/database`
- Constructor calls `super(FEATURE_COLLECTION)` using the **named constant** from `@shared/constants`
- Add only query methods beyond BaseRepository's built-ins (`findOne`, `findMany`, `findById`, `create`, `updateOne`, `updateById`, `deleteOne`, `deleteById`, `count`, `exists`)
- Export a singleton at the bottom: `export const featureRepository = new FeatureRepository()`

**For complex joins** (multi-collection lookups), access the raw collection via `getDB()`:
```ts
import { getDB } from "@shared/config";
const db = await getDB();
const result = await db.collection(FEATURE_COLLECTION).aggregate([
  { $match: { ... } },
  { $lookup: { from: OTHER_COLLECTION, localField: "...", foreignField: "_id", as: "..." } },
  { $unwind: { path: "$...", preserveNullAndEmptyArrays: true } },
]).toArray();
```

**For bulk operations:**
```ts
await db.collection(FEATURE_COLLECTION).insertMany(records);
await db.collection(FEATURE_COLLECTION).updateMany({ ... }, { $set: { ... } });
```

Reference for complex aggregations: `src/modules/billing/payment/payment.service.ts`

---

## Service (`<module>.service.ts`)

- Standalone exported async functions — NOT a class
- No HTTP imports (`Request`, `Response`, etc.)
- Call repository methods; call shared services for external integrations
- Set timestamps:
  - Create: `created_at: new Date(), updated_at: new Date()`
  - Update: `updated_at: new Date()`
- Return types: `WithId<FeatureName>` for single records, `WithId<FeatureName>[]` for lists

```ts
import { WithId } from "mongodb";
import { featureRepository } from "./feature.repository";

export const createFeature = async (
  data: Omit<FeatureName, "_id" | "created_at" | "updated_at">
): Promise<WithId<FeatureName>> => {
  return featureRepository.create({ ...data, created_at: new Date(), updated_at: new Date() });
};
```

---

## Controller (`<module>.controller.ts`)

- Each handler is a named exported const wrapped in `asyncHandler`
- Import `asyncHandler` from `@shared/middlewares`
- Import `ApiError` from `@shared/utils`
- Import `HTTP_STATUS`, `ERROR_MESSAGES`, `SUCCESS_MESSAGES`, `SUCCESS_MESSAGES_COMMON` from `@shared/constants`
- Extract user ID from JWT: `const userId = req.user?.userId`
- Convert userId → entityId via repository when needed (e.g., `parentRepository.findByUserId(userId)`)
- List responses include `count: array.length`

```ts
import { asyncHandler } from "@shared/middlewares";
import { ApiError } from "@shared/utils";
import { HTTP_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES_COMMON } from "@shared/constants";

export const getAll = asyncHandler(async (req, res) => {
  const items = await featureService.getAllFeatures();
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: items,
    count: items.length,
    message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
  });
});

export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params as Record<string, string>;
  const item = await featureService.getFeatureById(id);
  if (!item) throw ApiError.notFound(ERROR_MESSAGES.FEATURE.NOT_FOUND);
  res.status(HTTP_STATUS.OK).json({
    success: true,
    data: item,
    message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
  });
});
```

---

## Routes Handler Group (`<module>.routes.ts`)

- Export one `const <module>Handlers` object
- Group by role namespace: `.public`, `.admin`, `.parent`, `.driver`, `.school_admin`
- Bundle validation middleware inside the group (not in `src/routes/`)
- Import `validate` from `@shared/middlewares`
- No Express `Router`, no auth middleware — those live in `src/routes/<role>.routes.ts`

```ts
import { validate } from "@shared/middlewares";
import { createFeatureSchema, updateFeatureSchema } from "./feature.validation";
import { getAll, getById, create, update, deactivate } from "./feature.controller";

export const featureHandlers = {
  public: {
    getAll,
    getById,
  },
  admin: {
    validateCreate: validate(createFeatureSchema),
    create,
    validateUpdate: validate(updateFeatureSchema),
    update,
    deactivate,
  },
};
```

---

## Route Wiring (`src/routes/<role>.routes.ts`)

- Import the handler group from the module
- Apply `router.get(path, handler)` or `router.post(path, validate, handler)`
- Auth middleware is already applied once at the top of the router — do not repeat per-route

```ts
import { featureHandlers } from "@modules/feature";

// Inside the router:
router.get("/features", featureHandlers.public.getAll);
router.get("/features/:id", featureHandlers.public.getById);
router.post("/features", featureHandlers.admin.validateCreate, featureHandlers.admin.create);
router.patch("/features/:id", featureHandlers.admin.validateUpdate, featureHandlers.admin.update);
```

---

## Real-Time & Notifications

**Socket.IO only** (e.g., live position update, trip status change):
```ts
import { BroadcastService } from "@shared/services";
BroadcastService.notifyParentStudentPicked(parentId, tripId, studentId, studentName);
```

**Multi-channel** (push notification + socket event + DB record in one call):
```ts
import { NotificationDispatcher } from "@modules/notification";
await NotificationDispatcher.notifyStudentPickedUp(parentUserId, tripId, studentId, studentName);
```

Reference: `src/modules/notification/notification.dispatcher.ts`

---

## Pagination

For list endpoints that could return large result sets:
```ts
const limitQuery = req.query.limit as string;
const offsetQuery = req.query.offset as string;
const limit = Math.max(1, Math.min(Number(limitQuery) || 20, 1000));
const offset = Math.max(0, Number(offsetQuery) || 0);
```

---

## Cron Jobs

1. Create `<module>.cron.ts` in the module folder
2. Export a `start<Module>Cron()` function
3. Register it in `src/server.ts` after DB connection

Reference: `src/modules/billing/parent_subscription/parent_subscription.cron.ts`
