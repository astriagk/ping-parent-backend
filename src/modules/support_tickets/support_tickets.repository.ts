import { WithId } from "mongodb";

import { SUPPORT_TICKETS_COLLECTION } from "@shared/constants";
import { BaseRepository } from "@shared/database";

import { SupportTicket, TicketStatus } from "./support_tickets.type";

export class SupportTicketRepository extends BaseRepository<SupportTicket> {
  constructor() {
    super(SUPPORT_TICKETS_COLLECTION);
  }

  async findByUserId(userId: string): Promise<WithId<SupportTicket>[]> {
    return await this.findMany({ user_id: userId });
  }

  async findByStatus(status: TicketStatus): Promise<WithId<SupportTicket>[]> {
    return await this.findMany({ ticket_status: status });
  }

  async findByAssignedAdmin(adminId: string): Promise<WithId<SupportTicket>[]> {
    return await this.findMany({ assigned_to: adminId });
  }
}

export const supportTicketRepository = new SupportTicketRepository();
