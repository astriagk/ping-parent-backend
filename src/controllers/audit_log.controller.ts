import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { asyncHandler } from "@shared/middlewares";
import {
  getAuditLogById as getAuditLogByIdService,
  getAuditLogs as getAuditLogsService,
} from "@shared/services/audit_log.service";
import { AuditLogFilters } from "@shared/types/audit_log.type";

/**
 * Get all audit logs with filters
 */
export const getAuditLogs = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      user_id,
      admin_id,
      action,
      entity_type,
      entity_id,
      status,
      from_date,
      to_date,
      limit,
      offset,
    } = req.query;

    const filters: AuditLogFilters = {
      user_id: user_id as string,
      admin_id: admin_id as string,
      action: action as string,
      entity_type: entity_type as string,
      entity_id: entity_id as string,
      status: status as "success" | "failure",
      from_date: from_date ? new Date(from_date as string) : undefined,
      to_date: to_date ? new Date(to_date as string) : undefined,
      limit: limit ? parseInt(limit as string) : 100,
      offset: offset ? parseInt(offset as string) : 0,
    };

    const result = await getAuditLogsService(filters);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result.logs,
      meta: {
        total: result.total,
        limit: filters.limit,
        offset: filters.offset,
      },
      message: SUCCESS_MESSAGES.AUDIT_LOG.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

/**
 * Get audit log by ID
 */
export const getAuditLogById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const log = await getAuditLogByIdService(id);

    if (!log) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        data: null,
        message: ERROR_MESSAGES.AUDIT_LOG.NOT_FOUND,
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: log,
      message: SUCCESS_MESSAGES.AUDIT_LOG.FETCHED_SUCCESSFULLY,
    });
  },
);
