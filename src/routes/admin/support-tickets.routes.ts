import { Router } from "express";

import { supportTicketHandlers } from "@modules/support_tickets/support_tickets.routes";

const router = Router();

// --- Support Tickets ---
router.get("/support-tickets", supportTicketHandlers.admin.getAll);
router.get("/support-tickets/:id", supportTicketHandlers.admin.getById);
router.put(
  "/support-tickets/:id/status",
  supportTicketHandlers.admin.validateUpdateStatus,
  supportTicketHandlers.admin.updateStatus,
);
router.put(
  "/support-tickets/:id/assign",
  supportTicketHandlers.admin.validateAssign,
  supportTicketHandlers.admin.assign,
);

export default router;
