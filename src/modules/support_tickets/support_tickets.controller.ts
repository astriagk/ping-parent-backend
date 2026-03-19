import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  TicketPriority,
  TicketStatus,
  UserRole,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import { supportTicketRepository } from "./support_tickets.repository";

export const createSupportTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const { subject, description, priority } = req.body;

    const ticket = await supportTicketRepository.create({
      user_id: userId,
      subject,
      description,
      ticket_status: TicketStatus.OPEN,
      priority: priority ?? TicketPriority.MEDIUM,
      created_at: new Date(),
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: ticket,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.CREATED_SUCCESSFULLY,
    });
  },
);

export const getMySupportTickets = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const tickets = await supportTicketRepository.findByUserId(userId);

    return res.json({
      success: true,
      data: tickets,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getSupportTicketById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const ticket = await supportTicketRepository.findById(id);

    if (!ticket) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUPPORT_TICKET.NOT_FOUND,
      );
    }

    const canViewAnyTicket =
      userRole === UserRole.ADMIN || userRole === UserRole.SUPERADMIN;

    if (ticket.user_id !== userId && !canViewAnyTicket) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.COMMON.FORBIDDEN,
      );
    }

    return res.json({
      success: true,
      data: ticket,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.FETCHED_SUCCESSFULLY,
    });
  },
);

export const closeSupportTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.COMMON.UNAUTHORIZED,
      );
    }

    const ticket = await supportTicketRepository.findById(id);

    if (!ticket) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUPPORT_TICKET.NOT_FOUND,
      );
    }

    if (ticket.user_id !== userId) {
      throw new ApiError(
        HTTP_STATUS.FORBIDDEN,
        ERROR_MESSAGES.COMMON.FORBIDDEN,
      );
    }

    const updated = await supportTicketRepository.updateById(id, {
      ticket_status: TicketStatus.CLOSED,
      updated_at: new Date(),
    });

    return res.json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.CLOSED_SUCCESSFULLY,
    });
  },
);

// --- Admin handlers ---

export const getAllSupportTickets = asyncHandler(
  async (_req: Request, res: Response) => {
    const tickets = await supportTicketRepository.findMany({});

    return res.json({
      success: true,
      data: tickets,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateTicketStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const { ticket_status } = req.body;

    const ticket = await supportTicketRepository.findById(id);

    if (!ticket) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUPPORT_TICKET.NOT_FOUND,
      );
    }

    const updates: Partial<{
      ticket_status: TicketStatus;
      resolved_at: Date;
      updated_at: Date;
    }> = {
      ticket_status,
      updated_at: new Date(),
    };

    if (ticket_status === TicketStatus.RESOLVED) {
      updates.resolved_at = new Date();
    }

    const updated = await supportTicketRepository.updateById(id, updates);

    return res.json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.STATUS_UPDATED_SUCCESSFULLY,
    });
  },
);

export const assignTicket = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
    const { assigned_to } = req.body;

    const ticket = await supportTicketRepository.findById(id);

    if (!ticket) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.SUPPORT_TICKET.NOT_FOUND,
      );
    }

    const updated = await supportTicketRepository.updateById(id, {
      assigned_to,
      ticket_status: TicketStatus.IN_PROGRESS,
      updated_at: new Date(),
    });

    return res.json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES.SUPPORT_TICKET.ASSIGNED_SUCCESSFULLY,
    });
  },
);
