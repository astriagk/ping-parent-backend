import { Router } from "express";

import { roleHandlers } from "@modules/admin/role/role.routes";

const router = Router();

// --- Role Management ---
router.get("/roles", roleHandlers.getAll);
router.post("/roles", roleHandlers.validateCreate, roleHandlers.create);
router.get("/roles/:id", roleHandlers.getById);
router.put("/roles/:id", roleHandlers.validateUpdate, roleHandlers.update);
router.delete("/roles/:id", roleHandlers.delete);

export default router;
