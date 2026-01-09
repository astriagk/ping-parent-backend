import { WithId } from "mongodb";

import { paymentRepository } from "@modules/billing/payment/payment.repository";
import { Payment } from "@modules/billing/payment/payment.type";
import { getDB } from "@shared/config";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PaymentStatus,
  UniqueCodeTypes,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";
import { generateUniqueCode } from "@shared/utils";

/**
 * Helper function to convert userId to parent_id
 * This is needed because the payments table stores parent_id (from parents table)
 * but the authenticated user has user_id (from users table)
 */
const getParentIdByUserId = async (userId: string): Promise<string | null> => {
  const db = await getDB();
  const parent = await db
    .collection(PARENTS_COLLECTION)
    .findOne({ user_id: userId });

  if (!parent) {
    return null;
  }

  return String(parent._id);
};

export const createPayment = async (
  userId: string,
  data: Omit<
    Payment,
    "payment_id" | "parent_id" | "created_at" | "payment_date"
  >,
): Promise<WithId<Payment>> => {
  // Convert user_id to parent_id
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  // Validate amount
  if (data.amount <= 0) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PAYMENT.INVALID_AMOUNT,
    );
  }

  const paymentData: Payment = {
    payment_id: generateUniqueCode(UniqueCodeTypes.PAYMENT),
    parent_id: parentId,
    ...data,
    currency: data.currency || "INR",
    payment_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await paymentRepository.create(paymentData);
};

export const getPaymentById = async (
  id: string,
): Promise<WithId<Payment> | null> => {
  return await paymentRepository.findById(id);
};

/**
 * Get all payments across the system (admin only)
 */
export const getAllPayments = async (): Promise<WithId<Payment>[]> => {
  return await paymentRepository.findMany();
};

export const getPaymentsByUserId = async (
  userId: string,
): Promise<WithId<Payment>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await paymentRepository.findByParentId(parentId);
};

export const getPendingPaymentsByUserId = async (
  userId: string,
): Promise<WithId<Payment>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await paymentRepository.findPendingPaymentsByParentId(parentId);
};

export const getCompletedPaymentsByUserId = async (
  userId: string,
): Promise<WithId<Payment>[]> => {
  const parentId = await getParentIdByUserId(userId);

  if (!parentId) {
    throw new ApiError(
      HTTP_STATUS.NOT_FOUND,
      ERROR_MESSAGES.PARENT.PARENT_PROFILE_NOT_FOUND,
    );
  }

  return await paymentRepository.findCompletedPaymentsByParentId(parentId);
};

export const updatePayment = async (
  id: string,
  updates: Partial<Payment>,
): Promise<WithId<Payment> | null> => {
  const currentPayment = await paymentRepository.findById(id);

  if (!currentPayment) {
    return null;
  }

  // Prevent updating completed payments
  if (currentPayment.payment_status === PaymentStatus.COMPLETED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PAYMENT.CANNOT_UPDATE_COMPLETED,
    );
  }

  return await paymentRepository.updateById(id, {
    $set: { ...updates, updated_at: new Date() },
  });
};

export const completePayment = async (
  id: string,
  transactionId?: string,
  gatewayResponse?: any,
): Promise<WithId<Payment> | null> => {
  const currentPayment = await paymentRepository.findById(id);

  if (!currentPayment) {
    return null;
  }

  // Prevent completing already completed payments
  if (currentPayment.payment_status === PaymentStatus.COMPLETED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PAYMENT.ALREADY_COMPLETED,
    );
  }

  return await paymentRepository.updateById(id, {
    $set: {
      payment_status: PaymentStatus.COMPLETED,
      transaction_id: transactionId,
      gateway_response: gatewayResponse,
      payment_date: new Date(),
      updated_at: new Date(),
    },
  });
};

export const refundPayment = async (
  id: string,
  gatewayResponse?: any,
): Promise<WithId<Payment> | null> => {
  const currentPayment = await paymentRepository.findById(id);

  if (!currentPayment) {
    return null;
  }

  // Prevent refunding pending payments
  if (currentPayment.payment_status === PaymentStatus.PENDING) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PAYMENT.CANNOT_REFUND_PENDING,
    );
  }

  // Prevent refunding already refunded payments
  if (currentPayment.payment_status === PaymentStatus.REFUNDED) {
    throw new ApiError(
      HTTP_STATUS.BAD_REQUEST,
      ERROR_MESSAGES.PAYMENT.ALREADY_REFUNDED,
    );
  }

  return await paymentRepository.updateById(id, {
    $set: {
      payment_status: PaymentStatus.REFUNDED,
      gateway_response: gatewayResponse,
      updated_at: new Date(),
    },
  });
};
