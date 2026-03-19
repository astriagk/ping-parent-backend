import Joi from "joi";

import {
  TicketPriority,
  TicketStatus,
  VALIDATION_MESSAGES,
} from "@shared/constants";

export const createSupportTicketSchema = Joi.object({
  subject: Joi.string().max(200).required().messages({
    "any.required": VALIDATION_MESSAGES.SUPPORT_TICKET.SUBJECT_REQUIRED,
    "string.max": VALIDATION_MESSAGES.SUPPORT_TICKET.SUBJECT_MAX,
  }),
  description: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.SUPPORT_TICKET.DESCRIPTION_REQUIRED,
  }),
  priority: Joi.string()
    .valid(...Object.values(TicketPriority))
    .optional()
    .messages({
      "any.only": VALIDATION_MESSAGES.SUPPORT_TICKET.PRIORITY_INVALID,
    }),
});

export const updateTicketStatusSchema = Joi.object({
  ticket_status: Joi.string()
    .valid(TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED)
    .required()
    .messages({
      "any.required": VALIDATION_MESSAGES.SUPPORT_TICKET.STATUS_REQUIRED,
      "any.only": VALIDATION_MESSAGES.SUPPORT_TICKET.STATUS_INVALID,
    }),
});

export const assignTicketSchema = Joi.object({
  assigned_to: Joi.string().required().messages({
    "any.required": VALIDATION_MESSAGES.SUPPORT_TICKET.ASSIGNED_TO_REQUIRED,
  }),
});
