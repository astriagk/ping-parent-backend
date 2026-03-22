import { Router } from "express";

import { supportTicketHandlers } from "@modules/support_tickets/support_tickets.routes";

const router = Router();

// --- Support Tickets ---
router.post(
  "/support-tickets",
  supportTicketHandlers.shared.validateCreate,
  supportTicketHandlers.shared.create,
);
router.get("/support-tickets", supportTicketHandlers.shared.getMyTickets);
router.get("/support-tickets/:id", supportTicketHandlers.shared.getById);
router.post("/support-tickets/:id/close", supportTicketHandlers.shared.close);

export default router;
