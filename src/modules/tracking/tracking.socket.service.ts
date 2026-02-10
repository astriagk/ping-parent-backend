import {
  BroadcastSocketEvent,
  ParentNotificationEvent,
} from "@shared/constants";
import { socketService } from "@shared/services/socket.service";

export class TrackingSocketService {
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
  // These send events only to the specific parent of a student
  // Used for home pickup/drop events where only that parent should be notified
  // ============================================

  /**
   * Notify specific parent that their student was picked up
   * Use this for pickup from home (morning trip) - only parent of this student gets notified
   */
  static notifyParentStudentPicked(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ) {
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

  /**
   * Notify specific parent that their student was dropped off
   * Use this for drop at home (afternoon trip) - only parent of this student gets notified
   */
  static notifyParentStudentDropped(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    driverId?: string,
  ) {
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

  /**
   * Notify specific parent that driver is approaching their student's location
   * Use this for approach to home - only parent of this student gets notified
   */
  static notifyParentApproaching(
    parentId: string,
    tripId: string,
    studentId: string,
    studentName: string,
    eta: number,
    driverId?: string,
  ) {
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
}
