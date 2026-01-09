import { WithId } from "mongodb";

import { Payment } from "@modules/billing/payment/payment.type";
import { PAYMENTS_COLLECTION, PaymentStatus } from "@shared/constants";
import { BaseRepository } from "@shared/database";

export class PaymentRepository extends BaseRepository<Payment> {
  constructor() {
    super(PAYMENTS_COLLECTION);
  }

  async findByParentId(parentId: string): Promise<WithId<Payment>[]> {
    return await this.findMany(
      { parent_id: parentId },
      // { sort: { payment_date: -1 } },
    );
  }

  async findBySubscriptionId(
    subscriptionId: string,
  ): Promise<WithId<Payment>[]> {
    return await this.findMany({ subscription_id: subscriptionId });
  }

  async findByPaymentStatus(status: PaymentStatus): Promise<WithId<Payment>[]> {
    return await this.findMany({ payment_status: status });
  }

  async findByTransactionId(
    transactionId: string,
  ): Promise<WithId<Payment> | null> {
    return await this.findOne({ transaction_id: transactionId });
  }

  async findPendingPaymentsByParentId(
    parentId: string,
  ): Promise<WithId<Payment>[]> {
    return await this.findMany({
      parent_id: parentId,
      payment_status: PaymentStatus.PENDING,
    });
  }

  async findCompletedPaymentsByParentId(
    parentId: string,
  ): Promise<WithId<Payment>[]> {
    return await this.findMany(
      {
        parent_id: parentId,
        payment_status: PaymentStatus.COMPLETED,
      },
      // { sort: { payment_date: -1 } },
    );
  }
}

export const paymentRepository = new PaymentRepository();
