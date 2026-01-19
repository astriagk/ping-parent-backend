import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  createStudent as createStudentService,
  deleteStudentByStudentId as deleteStudentByStudentIdService,
  deleteStudent as deleteStudentService,
  getActiveStudentsByUserId,
  getStudentById,
  getStudentByStudentId as getStudentByStudentIdService,
  getStudentsByUserId,
  updateStudentByStudentId as updateStudentByStudentIdService,
  updateStudent as updateStudentService,
} from "./student.service";

export const createStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const studentData = req.body;

    const student = await createStudentService(userId, studentData);

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.CREATED_SUCCESSFULLY,
    });
  },
);

export const getStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const student = await getStudentById(id);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params;

    const student = await getStudentByStudentIdService(student_id);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const students = await getStudentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: students,
      message: SUCCESS_MESSAGES.STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const getMyActiveStudents = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new ApiError(
        HTTP_STATUS.UNAUTHORIZED,
        ERROR_MESSAGES.PARENT.USER_NOT_AUTHENTICATED,
      );
    }

    const students = await getActiveStudentsByUserId(userId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: students,
      message: SUCCESS_MESSAGES.STUDENT.LIST_FETCHED_SUCCESSFULLY,
    });
  },
);

export const updateStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    const student = await updateStudentService(id, updates);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.UPDATED_SUCCESSFULLY,
    });
  },
);

export const updateStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params;
    const updates = req.body;

    const student = await updateStudentByStudentIdService(student_id, updates);

    if (!student) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES.STUDENT.UPDATED_SUCCESSFULLY,
    });
  },
);

export const deleteStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const deleted = await deleteStudentService(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.STUDENT.DELETED_SUCCESSFULLY,
    });
  },
);

export const deleteStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params;

    const deleted = await deleteStudentByStudentIdService(student_id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES.STUDENT.DELETED_SUCCESSFULLY,
    });
  },
);
