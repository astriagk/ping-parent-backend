import { validate } from "@shared/middlewares";

import {
  assignTicket,
  closeSupportTicket,
  createSupportTicket,
  getAllSupportTickets,
  getMySupportTickets,
  getSupportTicketById,
  updateTicketStatus,
} from "./support_tickets.controller";
import {
  assignTicketSchema,
  createSupportTicketSchema,
  updateTicketStatusSchema,
} from "./support_tickets.validation";

/**
 * Handler group for support_tickets module.
 * Import in src/routes/shared.routes.ts (authenticated users) and
 * src/routes/admin.routes.ts (admin management).
 * NO auth middleware here — applied at route gateway level.
 */
export const supportTicketHandlers = {
  // Authenticated users (parent + driver) — wired in shared.routes.ts
  shared: {
    validateCreate: validate(createSupportTicketSchema),
    create: createSupportTicket,
    getMyTickets: getMySupportTickets,
    getById: getSupportTicketById,
    close: closeSupportTicket,
  },

  // Admin — wired in admin.routes.ts
  admin: {
    getAll: getAllSupportTickets,
    getById: getSupportTicketById,
    validateUpdateStatus: validate(updateTicketStatusSchema),
    updateStatus: updateTicketStatus,
    validateAssign: validate(assignTicketSchema),
    assign: assignTicket,
  },
};
