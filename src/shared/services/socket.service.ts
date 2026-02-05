import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

import { getDB } from "@shared/config";
import {
  BroadcastSocketEvent,
  DriverSocketEvent,
  ERROR_MESSAGES,
  PARENTS_COLLECTION,
  ParentSocketEvent,
  STUDENTS_COLLECTION,
  TRIPS_COLLECTION,
  TRIP_STUDENTS_COLLECTION,
  UserRole,
} from "@shared/constants";
import { verifyAccessToken } from "@shared/services/token.service";
import { logger } from "@shared/utils";

const POSITION_UPDATE_INTERVAL_MS = 5000;
const positionUpdateTimestamps = new Map<string, number>();

export class SocketService {
  private io: SocketIOServer;

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const userId = socket.handshake.auth.userId;
        const role = socket.handshake.auth.role as UserRole;

        if (!token || !userId || !role) {
          return next(
            new Error(ERROR_MESSAGES.SOCKET.MISSING_AUTH_CREDENTIALS),
          );
        }

        const allowedRoles = [UserRole.DRIVER, UserRole.PARENT, UserRole.ADMIN];
        if (!allowedRoles.includes(role)) {
          return next(new Error(ERROR_MESSAGES.SOCKET.INVALID_ROLE));
        }

        const payload = verifyAccessToken(token);

        if (payload.userId !== userId) {
          return next(new Error(ERROR_MESSAGES.SOCKET.USER_ID_MISMATCH));
        }

        if (payload.role !== role) {
          return next(new Error(ERROR_MESSAGES.SOCKET.ROLE_MISMATCH));
        }

        socket.data = { userId, role, token, verified: true };
        next();
      } catch (error: unknown) {
        logger.error("Socket auth failed:", error as object);
        return next(new Error(ERROR_MESSAGES.SOCKET.INVALID_OR_EXPIRED_TOKEN));
      }
    });
  }

  private async verifyDriverOwnsTrip(
    userId: string,
    tripId: string,
  ): Promise<boolean> {
    try {
      const db = await getDB();
      const driver = await db
        .collection("drivers")
        .findOne({ user_id: userId });

      if (!driver) return false;

      const trip = await db
        .collection(TRIPS_COLLECTION)
        .findOne({ trip_id: tripId, driver_id: String(driver._id) });

      return !!trip;
    } catch {
      return false;
    }
  }

  private async verifyParentHasStudentOnTrip(
    userId: string,
    tripId: string,
  ): Promise<boolean> {
    try {
      const db = await getDB();
      const parent = await db
        .collection(PARENTS_COLLECTION)
        .findOne({ user_id: userId });

      if (!parent) return false;

      const students = await db
        .collection(STUDENTS_COLLECTION)
        .find({ parent_id: String(parent._id) })
        .toArray();

      if (students.length === 0) return false;

      const studentIds = students.map((s) => s.student_id);
      const tripStudent = await db
        .collection(TRIP_STUDENTS_COLLECTION)
        .findOne({ trip_id: tripId, student_id: { $in: studentIds } });

      return !!tripStudent;
    } catch {
      return false;
    }
  }

  private checkPositionRateLimit(tripId: string): boolean {
    const now = Date.now();
    const lastUpdate = positionUpdateTimestamps.get(tripId) || 0;

    if (now - lastUpdate < POSITION_UPDATE_INTERVAL_MS) {
      return false;
    }

    positionUpdateTimestamps.set(tripId, now);
    return true;
  }

  private setupConnectionHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const { userId, role } = socket.data;
      logger.info(`Socket connected: ${userId} (${role})`);

      socket.on(
        DriverSocketEvent.SUBSCRIBE_TRIP,
        async (tripId: string, callback?: (success: boolean) => void) => {
          if (socket.data.role !== UserRole.DRIVER) {
            socket.emit(BroadcastSocketEvent.ERROR, {
              message: ERROR_MESSAGES.SOCKET.ONLY_DRIVERS_CAN_SUBSCRIBE,
            });
            if (callback) callback(false);
            return;
          }

          const isAuthorized = await this.verifyDriverOwnsTrip(userId, tripId);
          if (!isAuthorized) {
            socket.emit(BroadcastSocketEvent.ERROR, {
              message: ERROR_MESSAGES.SOCKET.NOT_AUTHORIZED_TO_ACCESS_TRIP,
            });
            if (callback) callback(false);
            return;
          }

          socket.join(`trip:${tripId}:driver`);
          if (callback) callback(true);
        },
      );

      socket.on(
        ParentSocketEvent.SUBSCRIBE_TRIP,
        async (tripId: string, callback?: (success: boolean) => void) => {
          if (socket.data.role !== UserRole.PARENT) {
            socket.emit(BroadcastSocketEvent.ERROR, {
              message: ERROR_MESSAGES.SOCKET.ONLY_PARENTS_CAN_SUBSCRIBE,
            });
            if (callback) callback(false);
            return;
          }

          const isAuthorized = await this.verifyParentHasStudentOnTrip(
            userId,
            tripId,
          );
          if (!isAuthorized) {
            socket.emit(BroadcastSocketEvent.ERROR, {
              message: ERROR_MESSAGES.SOCKET.NOT_AUTHORIZED_TO_TRACK_TRIP,
            });
            if (callback) callback(false);
            return;
          }

          socket.join(`trip:${tripId}:tracking`);
          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.UPDATE_POSITION,
        (
          data: {
            tripId: string;
            latitude: number;
            longitude: number;
            speed?: number;
            heading?: number;
            accuracy?: number;
          },
          callback?: (success: boolean) => void,
        ) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          const { tripId, latitude, longitude, speed, heading, accuracy } =
            data;

          if (!this.checkPositionRateLimit(tripId)) {
            if (callback) callback(false);
            return;
          }

          if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
          ) {
            socket.emit(BroadcastSocketEvent.ERROR, {
              message: ERROR_MESSAGES.SOCKET.INVALID_COORDINATES,
            });
            if (callback) callback(false);
            return;
          }

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.POSITION_UPDATE, {
              tripId,
              driverId: userId,
              latitude,
              longitude,
              speed: speed || 0,
              heading: heading || 0,
              accuracy: accuracy || 0,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.TRIP_STARTED,
        (tripId: string, callback?: (success: boolean) => void) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.TRIP_STARTED, {
              tripId,
              driverId: userId,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.TRIP_COMPLETED,
        (tripId: string, callback?: (success: boolean) => void) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.TRIP_COMPLETED, {
              tripId,
              driverId: userId,
              timestamp: new Date(),
            });

          positionUpdateTimestamps.delete(tripId);
          socket.leave(`trip:${tripId}:driver`);
          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.APPROACHING_WAYPOINT,
        (
          data: { tripId: string; studentId: string; eta: number },
          callback?: (success: boolean) => void,
        ) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          const { tripId, studentId, eta } = data;

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.APPROACHING, {
              tripId,
              studentId,
              eta,
              driverId: userId,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.STUDENT_PICKED,
        (
          data: { tripId: string; studentId: string },
          callback?: (success: boolean) => void,
        ) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          const { tripId, studentId } = data;

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.STUDENT_PICKED, {
              tripId,
              studentId,
              driverId: userId,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.STUDENT_DROPPED,
        (
          data: { tripId: string; studentId: string },
          callback?: (success: boolean) => void,
        ) => {
          if (socket.data.role !== UserRole.DRIVER) {
            if (callback) callback(false);
            return;
          }

          const { tripId, studentId } = data;

          this.io
            .to(`trip:${tripId}:tracking`)
            .emit(BroadcastSocketEvent.STUDENT_DROPPED, {
              tripId,
              studentId,
              driverId: userId,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(ParentSocketEvent.UNSUBSCRIBE_TRIP, (tripId: string) => {
        socket.leave(`trip:${tripId}:tracking`);
      });

      socket.on(DriverSocketEvent.UNSUBSCRIBE_TRIP, (tripId: string) => {
        socket.leave(`trip:${tripId}:driver`);
        positionUpdateTimestamps.delete(tripId);
      });

      socket.on("disconnect", () => {
        logger.info(`Socket disconnected: ${userId}`);
      });

      socket.on("error", (error) => {
        logger.error(`Socket error: ${userId}`, error);
      });
    });
  }

  public broadcastToTrip(
    tripId: string,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    this.io.to(`trip:${tripId}:tracking`).emit(event, data);
  }

  public notifyDriver(
    tripId: string,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    this.io.to(`trip:${tripId}:driver`).emit(event, data);
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}

export let socketService: SocketService;

export const initializeSocket = (server: HTTPServer): SocketService => {
  socketService = new SocketService(server);
  return socketService;
};
