import { BroadcastSocketEvent } from "@shared/constants";
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
}
