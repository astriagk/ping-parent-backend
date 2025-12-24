import { Request, Response } from "express";
import { getParentProfile, updateParentProfile } from "../services/parent.service";
import { getStudentsByParentId, getStudentById } from "../services/student.service";
import { getTodayTripsByStudentId, getTripLiveLocation, getTripById } from "../services/trip.service";
import { getNotificationsByParentId } from "../services/notification.service";
import { createCallParentRequest, getParentPhoneNumber } from "../services/communication.service";
import { createNotification } from "../services/notification.service";
import { emitToUser } from "../services/websocket.service";

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const profile = await getParentProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Parent profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error("Error fetching parent profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch parent profile",
    });
  }
};

export const getStudents = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.userId;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const students = await getStudentsByParentId(parentId);

    return res.status(200).json({
      success: true,
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch students",
    });
  }
};

export const getTodayTrips = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.userId;
    const { studentId } = req.params;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required",
      });
    }

    const student = await getStudentById(studentId, parentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found or does not belong to this parent",
      });
    }

    const trips = await getTodayTripsByStudentId(studentId, parentId);

    return res.status(200).json({
      success: true,
      data: trips,
    });
  } catch (error) {
    console.error("Error fetching today's trips:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch today's trips",
    });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const status = req.query.status as "unread" | "read" | undefined;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    const notifications = await getNotificationsByParentId(parentId, limit, status);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch notifications",
    });
  }
};

export const getTripLiveLocationController = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.userId;
    const { tripId } = req.params;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!tripId) {
      return res.status(400).json({
        success: false,
        error: "Trip ID is required",
      });
    }

    const trip = await getTripById(tripId, parentId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        error: "Trip not found or does not belong to this parent",
      });
    }

    const liveLocation = await getTripLiveLocation(tripId, parentId);

    if (!liveLocation) {
      return res.status(404).json({
        success: false,
        error: "Live location not available for this trip",
      });
    }

    return res.status(200).json({
      success: true,
      data: liveLocation,
    });
  } catch (error) {
    console.error("Error fetching trip live location:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch trip live location",
    });
  }
};

export const getStudentDetail = async (req: Request, res: Response) => {
  try {
    const parentId = req.user?.userId;
    const { studentId } = req.params;

    if (!parentId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required",
      });
    }

    const student = await getStudentById(studentId, parentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found or does not belong to this parent",
      });
    }

    return res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Error fetching student details:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch student details",
    });
  }
};

export const callParent = async (req: Request, res: Response) => {
  try {
    const requestedBy = req.user?.userId;
    const { studentId } = req.params;
    const { reason } = req.body;

    if (!requestedBy) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "Student ID is required",
      });
    }

    const student = await getStudentById(studentId, requestedBy);

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student not found",
      });
    }

    const parentId = student.parentId;

    const callRequest = await createCallParentRequest(
      studentId,
      parentId,
      requestedBy,
      reason
    );

    const phoneNumber = await getParentPhoneNumber(parentId);

    await createNotification({
      userId: parentId,
      parentId,
      type: "alert",
      title: "Call Request",
      message: `A call request has been made regarding ${student.firstName}`,
      relatedEntityType: "student",
      relatedEntityId: studentId,
      status: "unread",
      priority: "high",
      createdAt: new Date(),
    });

    emitToUser(parentId, "notification:new", {
      title: "Call Request",
      message: `A call request has been made regarding ${student.firstName}`,
      type: "alert",
    });

    return res.status(200).json({
      success: true,
      data: {
        callRequest,
        phoneNumber,
        message: "Call request created successfully",
      },
    });
  } catch (error) {
    console.error("Error creating call parent request:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to create call parent request",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: "No updates provided",
      });
    }

    const updated = await updateParentProfile(userId, updates);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Parent profile not found or no changes made",
      });
    }

    const updatedProfile = await getParentProfile(userId);

    return res.status(200).json({
      success: true,
      data: updatedProfile,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.error("Error updating parent profile:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to update parent profile",
    });
  }
};
