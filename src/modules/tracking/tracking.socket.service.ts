import { socketService } from "@shared/services/socket.service";

/**
 * Service for handling socket events related to tracking
 */
export class TrackingSocketService {
  /**
   * Emit position update to parents watching a trip
   */
  static broadcastPositionUpdate(tripId: string, positionData: any) {
    socketService.broadcastToTrip(tripId, "trip:position_update", {
      ...positionData,
      timestamp: new Date(),
    });
  }

  /**
   * Emit trip started event
   */
  static broadcastTripStarted(tripId: string, driverId: string) {
    socketService.broadcastToTrip(tripId, "trip:started", {
      tripId,
      driverId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit trip completed event
   */
  static broadcastTripCompleted(tripId: string, driverId: string) {
    socketService.broadcastToTrip(tripId, "trip:completed", {
      tripId,
      driverId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit approaching waypoint event
   */
  static broadcastApproachingWaypoint(
    tripId: string,
    driverId: string,
    studentId: string,
    eta: number,
  ) {
    socketService.broadcastToTrip(tripId, "trip:approaching", {
      tripId,
      driverId,
      studentId,
      eta,
      timestamp: new Date(),
    });
  }

  /**
   * Emit student picked up event
   */
  static broadcastStudentPicked(
    tripId: string,
    driverId: string,
    studentId: string,
  ) {
    socketService.broadcastToTrip(tripId, "trip:student_picked", {
      tripId,
      driverId,
      studentId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit student dropped off event
   */
  static broadcastStudentDropped(
    tripId: string,
    driverId: string,
    studentId: string,
  ) {
    socketService.broadcastToTrip(tripId, "trip:student_dropped", {
      tripId,
      driverId,
      studentId,
      timestamp: new Date(),
    });
  }

  /**
   * Emit route calculated event
   */
  static broadcastRouteCalculated(tripId: string, routeData: any) {
    socketService.broadcastToTrip(tripId, "trip:route_calculated", {
      tripId,
      routeData,
      timestamp: new Date(),
    });
  }

  /**
   * Notify driver of an event
   */
  static notifyDriverEvent(tripId: string, event: string, data: any) {
    socketService.notifyDriver(tripId, event, {
      ...data,
      timestamp: new Date(),
    });
  }
}
