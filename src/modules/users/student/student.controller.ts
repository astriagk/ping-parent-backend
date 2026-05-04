import { Request, Response } from "express";

import {
  ERROR_MESSAGES,
  HTTP_STATUS,
  SUCCESS_MESSAGES_COMMON,
} from "@shared/constants";
import { ApiError, asyncHandler } from "@shared/middlewares";

import {
  adminBulkCreateStudentsForParent,
  adminCreateStudentForParent,
  adminGetStudentsByParentId,
  adminSoftDeleteStudent,
  adminUpdateStudent,
  createStudent as createStudentService,
  deleteStudentByStudentId as deleteStudentByStudentIdService,
  deleteStudent as deleteStudentService,
  getActiveStudentsByUserId,
  getStudentById,
  getStudentByStudentId as getStudentByStudentIdService,
  getStudentsBySchoolId,
  getStudentsByUserId,
  updateStudentByStudentId as updateStudentByStudentIdService,
  updateStudent as updateStudentService,
} from "./student.service";
import { AdminStudentInput } from "./student.type";

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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const getStudentProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
    });
  },
);

export const getStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params as Record<string, string>;

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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
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
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

export const updateStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const updateStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params as Record<string, string>;
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
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const deleteStudent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params as Record<string, string>;

    const deleted = await deleteStudentService(id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);

export const getStudentsBySchool = asyncHandler(
  async (req: Request, res: Response) => {
    const { schoolId } = req.params as Record<string, string>;

    const students = await getStudentsBySchoolId(schoolId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: students,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

export const deleteStudentByStudentId = asyncHandler(
  async (req: Request, res: Response) => {
    const { student_id } = req.params as Record<string, string>;

    const deleted = await deleteStudentByStudentIdService(student_id);

    if (!deleted) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);

export const adminGetParentStudentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;
    const students = await adminGetStudentsByParentId(parentId);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: students,
      message: SUCCESS_MESSAGES_COMMON.LIST_FETCHED,
    });
  },
);

export const adminCreateStudentForParentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;
    const student = await adminCreateStudentForParent(
      parentId,
      req.body as AdminStudentInput,
    );

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: student,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminBulkCreateStudentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { parentId } = req.params as Record<string, string>;
    const students = (req.body?.students || []) as AdminStudentInput[];

    const result = await adminBulkCreateStudentsForParent(parentId, students);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: result,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_CREATED,
    });
  },
);

export const adminUpdateStudentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params as Record<string, string>;
    const updated = await adminUpdateStudent(studentId, req.body);

    if (!updated) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_UPDATED,
    });
  },
);

export const adminDeleteStudentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { studentId } = req.params as Record<string, string>;
    const ok = await adminSoftDeleteStudent(studentId);

    if (!ok) {
      throw new ApiError(
        HTTP_STATUS.NOT_FOUND,
        ERROR_MESSAGES.STUDENT.NOT_FOUND,
      );
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: SUCCESS_MESSAGES_COMMON.RESOURCE_DELETED,
    });
  },
);
