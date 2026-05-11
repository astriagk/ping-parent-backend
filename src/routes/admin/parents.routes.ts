import { Router } from "express";

import { parentHandlers } from "@modules/users/parent/parent.routes";
import { studentHandlers } from "@modules/users/student/student.routes";

const router = Router();

router.post(
  "/parents",
  parentHandlers.admin.validateCreate,
  parentHandlers.admin.create,
);
router.put(
  "/parents/:parentId",
  parentHandlers.admin.validateUpdate,
  parentHandlers.admin.update,
);
router.delete("/parents/:parentId", parentHandlers.admin.delete);

router.get("/parents/:parentId/address", parentHandlers.admin.getAddress);
router.put(
  "/parents/:parentId/address",
  parentHandlers.admin.validateAddress,
  parentHandlers.admin.upsertAddress,
);

router.get("/parents/:parentId/students", studentHandlers.admin.getByParent);
router.post(
  "/parents/:parentId/students",
  studentHandlers.admin.validateCreateForParent,
  studentHandlers.admin.createForParent,
);
router.post(
  "/parents/:parentId/students/bulk",
  studentHandlers.admin.validateBulk,
  studentHandlers.admin.bulkCreate,
);

export default router;
