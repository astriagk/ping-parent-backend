import { Router } from "express";

import { parentHandlers } from "@modules/users/parent/parent.routes";

const router = Router();

router.post(
  "/bulk/parents",
  parentHandlers.admin.validateBulkParents,
  parentHandlers.admin.bulkCreateParents,
);
router.post(
  "/bulk/parents-with-students",
  parentHandlers.admin.validateBulkParentsWithStudents,
  parentHandlers.admin.bulkCreateParentsWithStudents,
);

export default router;
