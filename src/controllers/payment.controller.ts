import { Request, Response } from "express";

import { ERROR_MESSAGES, HTTP_STATUS, SUCCESS_MESSAGES } from "@constants";
import { ApiError, asyncHandler } from "@middlewares";
import {
  completePayment,
  createPayment as createPaymentService,
  getCompletedPaymentsByUserId,
  getPaymentById,
  getPaymentsByUserId,
  getPendingPaymentsByUserId,
  refundPayment,
  updatePayment,
} from "@services/payment.service";

// NOTE: Exports WITHOUT "Controller" suffix
export const createPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From JWT token

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const paymentData = req.body; // Does NOT include parent_id

    const payment = await createPaymentService(userId, paymentData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: payment,
      message: SUCCESS_MESSAGES.PAYMENT.CREATED_SUCCESSFULLY,
    });
  },
);

export const getPaymentByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await getPaymentById(id);

    if (!payment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PAYMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: payment,
      message: SUCCESS_MESSAGES.PAYMENT.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const payments = await getPaymentsByUserId(userId);

    return res.json({
      success: true,
      data: payments,
      message: SUCCESS_MESSAGES.PAYMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyPendingPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const payments = await getPendingPaymentsByUserId(userId);

    return res.json({
      success: true,
      data: payments,
      message: SUCCESS_MESSAGES.PAYMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyCompletedPayments = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId; // From auth middleware

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const payments = await getCompletedPaymentsByUserId(userId);

    return res.json({
      success: true,
      data: payments,
      message: SUCCESS_MESSAGES.PAYMENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updatePaymentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const payment = await updatePayment(id, updates);

    if (!payment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PAYMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: payment,
      message: SUCCESS_MESSAGES.PAYMENT.UPDATED_SUCCESSFULLY,
    });
  },
);

export const completePaymentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { transaction_id, gateway_response } = req.body;

    const payment = await completePayment(id, transaction_id, gateway_response);

    if (!payment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PAYMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: payment,
      message: SUCCESS_MESSAGES.PAYMENT.COMPLETED_SUCCESSFULLY,
    });
  },
);

export const refundPaymentById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { gateway_response } = req.body;

    const payment = await refundPayment(id, gateway_response);

    if (!payment) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.PAYMENT.NOT_FOUND,
      );
    }

    return res.json({
      success: true,
      data: payment,
      message: SUCCESS_MESSAGES.PAYMENT.REFUNDED_SUCCESSFULLY,
    });
  },
);
