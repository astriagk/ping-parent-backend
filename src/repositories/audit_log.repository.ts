import { WithId } from "mongodb";

import { AUDIT_LOGS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";
import { AuditLog, AuditLogFilters } from "@shared/types/audit_log.type";

export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(AUDIT_LOGS_COLLECTION);
  }

  async findByLogId(logId: string): Promise<WithId<AuditLog> | null> {
    return await this.findOne({ log_id: logId });
  }

  async findByFilters(filters: AuditLogFilters): Promise<WithId<AuditLog>[]> {
    const query: any = {};

    if (filters.user_id) {
      query.user_id = filters.user_id;
    }

    if (filters.admin_id) {
      query.admin_id = filters.admin_id;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.entity_type) {
      query.entity_type = filters.entity_type;
    }

    if (filters.entity_id) {
      query.entity_id = filters.entity_id;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.from_date || filters.to_date) {
      query.created_at = {};
      if (filters.from_date) {
        query.created_at.$gte = filters.from_date;
      }
      if (filters.to_date) {
        query.created_at.$lte = filters.to_date;
      }
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    const collection = await this.getCollection();
    return await collection
      .find(query)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async countByFilters(filters: AuditLogFilters): Promise<number> {
    const query: any = {};

    if (filters.user_id) {
      query.user_id = filters.user_id;
    }

    if (filters.admin_id) {
      query.admin_id = filters.admin_id;
    }

    if (filters.action) {
      query.action = filters.action;
    }

    if (filters.entity_type) {
      query.entity_type = filters.entity_type;
    }

    if (filters.entity_id) {
      query.entity_id = filters.entity_id;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.from_date || filters.to_date) {
      query.created_at = {};
      if (filters.from_date) {
        query.created_at.$gte = filters.from_date;
      }
      if (filters.to_date) {
        query.created_at.$lte = filters.to_date;
      }
    }

    return await this.count(query);
  }
}

export const auditLogRepository = new AuditLogRepository();
