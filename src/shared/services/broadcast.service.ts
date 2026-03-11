import {
  BroadcastSocketEvent,
  ParentNotificationEvent,
} from "@shared/constants";
import { socketService } from "@shared/services/socket.service";
import { logger } from "@shared/utils";

export class BroadcastService {
  static broadcastPositionUpdate(tripId: string, positionData: any) {
    socketService.broadcastToTrip(
      tripId,
      BroadcastSocketEvent.POSITION_UPDATE,
      { ...positionData, timestamp: new Date() },
    );
  }

  static broadcastTripStarted(tripId: string, driverId: string) {
    socketService.broadcastToTrip(tripId, BroadcastSocketEvent.TRIP_STARTED, {
      tripId,
      driverId,
      timestamp: new Date(),
    });
  }

  static broadcastTripCompleted(tripId: string, driverId: string) {
    socketService.broadcastToTrip(tripId, BroadcastSocketEvent.TRIP_COMPLETED, {
      tripId,
      driverId,
      timestamp: new Date(),
    });
  }

  static broadcastApproachingWaypoint(
    tripId: string,
    driverId: string,
    studentId: string,
    eta: number,
  ) {
    socketService.broadcastToTrip(tripId, BroadcastSocketEvent.APPROACHING, {
      tripId,
      driverId,
      studentId,
      eta,
      timestamp: new Date(),
    });
  }

  static broadcastStudentPicked(
    tripId: string,
    driverId: string,
    studentId: string,
  ) {
    socketService.broadcastToTrip(tripId, BroadcastSocketEvent.STUDENT_PICKED, {
      tripId,
      driverId,
      studentId,
      timestamp: new Date(),
    });
  }

  static broadcastStudentDropped(
    tripId: string,
    driverId: string,
    studentId: string,
  ) {
    socketService.broadcastToTrip(
      tripId,
      BroadcastSocketEvent.STUDENT_DROPPED,
      { tripId, driverId, studentId, timestamp: new Date() },
    );
  }

  static broadcastRouteCalculated(tripId: string, routeData: any) {
    socketService.broadcastToTrip(
      tripId,
      BroadcastSocketEvent.ROUTE_CALCULATED,
      { tripId, routeData, timestamp: new Date() },
    );
  }

  static notifyDriverEvent(tripId: string, event: string, data: any) {
    socketService.notifyDriver(tripId, event, {
      ...data,
      timestamp: new Date(),
    });
  }

  // ============================================
  // Parent-Specific Notifications
  // ============================================

  static notifyParentStudentPicked(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ) {
    logger.info(
      `[Notify Parent] Student Picked | Parent: ${parentId} | Trip: ${tripId} | Student: ${studentId} | Driver: ${driverId}`,
    );
    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_PICKED,
      {
        tripId,
        studentId,
        studentName,
        driverId,
        message: `Your child ${studentName} has been picked up`,
        timestamp: new Date(),
      },
    );
  }

  static notifyParentStudentDropped(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ) {
    logger.info(
      `[Notify Parent] Student Dropped | Parent: ${parentId} | Trip: ${tripId} | Student: ${studentId} | Driver: ${driverId}`,
    );
    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_DROPPED,
      {
        tripId,
        studentId,
        studentName,
        driverId,
        message: `Your child ${studentName} has been dropped off`,
        timestamp: new Date(),
      },
    );
  }

  static notifyParentApproaching(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    eta: number,
    driverId?: string,
  ) {
    logger.info(
      `[Notify Parent] Student Approaching | Parent: ${parentId} | Trip: ${tripId} | Student: ${studentId} | Driver: ${driverId} | ETA: ${eta}`,
    );
    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_APPROACHING,
      {
        tripId,
        studentId,
        studentName,
        eta,
        driverId,
        message: `Driver is approaching - ETA ${Math.ceil(eta / 60)} minutes`,
        timestamp: new Date(),
      },
    );
  }

  // ============================================
  // Bulk Parent Notifications
  // ============================================

  static notifyParentStudentsPicked(
    parentId: string,
    tripId: string,
    students: { studentId: string; studentName: string }[],
    driverId?: string,
  ) {
    const studentNames = students.map((s) => s.studentName).join(", ");
    const studentIds = students.map((s) => s.studentId);
    const message =
      students.length === 1
        ? `Your child ${studentNames} has been picked up`
        : `Your children ${studentNames} have been picked up`;

    logger.info(
      `[Notify Parent] Students Picked | Parent: ${parentId} | Trip: ${tripId} | Students: ${studentIds.join(", ")} | Driver: ${driverId}`,
    );

    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_PICKED,
      {
        tripId,
        studentIds,
        students,
        driverId,
        message,
        timestamp: new Date(),
      },
    );
  }

  static notifyParentStudentsDropped(
    parentId: string,
    tripId: string,
    students: { studentId: string; studentName: string }[],
    driverId?: string,
  ) {
    const studentNames = students.map((s) => s.studentName).join(", ");
    const studentIds = students.map((s) => s.studentId);
    const message =
      students.length === 1
        ? `Your child ${studentNames} has been dropped off`
        : `Your children ${studentNames} have been dropped off`;

    logger.info(
      `[Notify Parent] Students Dropped | Parent: ${parentId} | Trip: ${tripId} | Students: ${studentIds.join(", ")} | Driver: ${driverId}`,
    );
    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_DROPPED,
      {
        tripId,
        studentIds,
        students,
        driverId,
        message,
        timestamp: new Date(),
      },
    );
  }

  static notifyParentStudentsAbsent(
    parentId: string,
    tripId: string,
    students: { studentId: string; studentName: string }[],
    driverId?: string,
  ) {
    const studentNames = students.map((s) => s.studentName).join(", ");
    const studentIds = students.map((s) => s.studentId);
    const message =
      students.length === 1
        ? `Your child ${studentNames} was marked absent`
        : `Your children ${studentNames} were marked absent`;

    logger.info(
      `[Notify Parent] Students Absent | Parent: ${parentId} | Trip: ${tripId} | Students: ${studentIds.join(", ")} | Driver: ${driverId}`,
    );
    socketService.emitToParent(
      parentId,
      ParentNotificationEvent.MY_STUDENT_ABSENT,
      {
        tripId,
        studentIds,
        students,
        driverId,
        message,
        timestamp: new Date(),
      },
    );
  }
}
