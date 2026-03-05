import { WithId } from "mongodb";

import { getDB } from "@shared/config";
import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  PARENTS_COLLECTION,
  PARENT_SUBSCRIPTIONS_COLLECTION,
  PAYMENTS_COLLECTION,
  PaymentStatus,
  SUBSCRIPTION_PLANS_COLLECTION,
  USERS_COLLECTION,
} from "@shared/constants";
import { ApiError } from "@shared/middlewares";

import { paymentRepository } from "./payment.repository";
import { Payment } from "./payment.type";

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
  data: Omit<Payment, "parent_id" | "created_at" | "payment_date">,
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
    parent_id: parentId,
    ...data,
    currency: data.currency || "INR",
    payment_date: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  };

  return await paymentRepository.create(paymentData);
};

/**
 * Get payment by ID for admin — with parent name/phone and plan name joined
 */
export const getPaymentById = async (
  id: string,
): Promise<Record<string, unknown> | null> => {
  const db = await getDB();
  const { ObjectId } = await import("mongodb");
  const results = await db
    .collection(PAYMENTS_COLLECTION)
    .aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $addFields: { parent_obj_id: { $toObjectId: "$parent_id" } },
      },
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          localField: "parent_obj_id",
          foreignField: "_id",
          as: "parent",
        },
      },
      { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          parent_user_obj_id: {
            $cond: [
              { $ne: ["$parent.user_id", null] },
              { $toObjectId: "$parent.user_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: USERS_COLLECTION,
          localField: "parent_user_obj_id",
          foreignField: "_id",
          as: "parent_user",
        },
      },
      { $unwind: { path: "$parent_user", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          subscription_obj_id: {
            $cond: [
              { $ne: ["$subscription_id", null] },
              { $toObjectId: "$subscription_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: PARENT_SUBSCRIPTIONS_COLLECTION,
          localField: "subscription_obj_id",
          foreignField: "_id",
          as: "subscription",
        },
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          plan_obj_id: {
            $cond: [
              { $ne: ["$subscription.plan_id", null] },
              { $toObjectId: "$subscription.plan_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: SUBSCRIPTION_PLANS_COLLECTION,
          localField: "plan_obj_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          parent_obj_id: 0,
          parent_user_obj_id: 0,
          subscription_obj_id: 0,
          plan_obj_id: 0,
          "parent.user_id": 0,
          "parent.updated_at": 0,
          parent_user: 0,
        },
      },
      {
        $addFields: {
          parent: {
            $cond: {
              if: { $ne: ["$parent", null] },
              then: {
                parent_id: { $toString: "$parent._id" },
                name: "$parent.name",
                email: "$parent.email",
                phone_number: "$parent_user.phone_number",
              },
              else: null,
            },
          },
          plan_name: "$plan.plan_name",
          plan_type: "$plan.plan_type",
        },
      },
      { $project: { plan: 0, subscription: 0 } },
    ])
    .toArray();
  return results[0] ?? null;
};

/**
 * Get all payments across the system (admin only) — with parent name/phone and plan name joined
 */
export const getAllPayments = async (): Promise<Record<string, unknown>[]> => {
  const db = await getDB();
  return await db
    .collection(PAYMENTS_COLLECTION)
    .aggregate([
      {
        $addFields: { parent_obj_id: { $toObjectId: "$parent_id" } },
      },
      {
        $lookup: {
          from: PARENTS_COLLECTION,
          localField: "parent_obj_id",
          foreignField: "_id",
          as: "parent",
        },
      },
      { $unwind: { path: "$parent", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          parent_user_obj_id: {
            $cond: [
              { $ne: ["$parent.user_id", null] },
              { $toObjectId: "$parent.user_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: USERS_COLLECTION,
          localField: "parent_user_obj_id",
          foreignField: "_id",
          as: "parent_user",
        },
      },
      { $unwind: { path: "$parent_user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "parent_subscriptions",
          localField: "subscription_id",
          foreignField: "plan_id",
          as: "subscription",
        },
      },
      { $unwind: { path: "$subscription", preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          plan_obj_id: {
            $cond: [
              { $ne: ["$subscription.plan_id", null] },
              { $toObjectId: "$subscription.plan_id" },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: SUBSCRIPTION_PLANS_COLLECTION,
          localField: "plan_obj_id",
          foreignField: "_id",
          as: "plan",
        },
      },
      { $unwind: { path: "$plan", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          parent_id: 1,
          payment_type: 1,
          amount: 1,
          currency: 1,
          payment_method: 1,
          payment_status: 1,
          transaction_id: 1,
          subscription_id: 1,
          payment_date: 1,
          created_at: 1,
          parent_name: "$parent.name",
          parent_phone: "$parent_user.phone_number",
          plan_name: "$plan.plan_name",
          plan_type: "$plan.plan_type",
        },
      },
    ])
    .toArray();
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
