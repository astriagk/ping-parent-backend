import { Server as HTTPServer } from "http";
import { ObjectId } from "mongodb";
import { Socket, Server as SocketIOServer } from "socket.io";

import { trackingRepository } from "@modules/tracking/tracking.repository";
import { getDB } from "@shared/config";
import {
  BroadcastSocketEvent,
  DRIVERS_COLLECTION,
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
        .collection(DRIVERS_COLLECTION)
        .findOne({ user_id: userId });

      if (!driver) return false;

      const trip = await db
        .collection(TRIPS_COLLECTION)
        .findOne({ _id: new ObjectId(tripId), driver_id: String(driver._id) });

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

      const studentIds = students.map((s) => String(s._id));
      const tripStudent = await db
        .collection(TRIP_STUDENTS_COLLECTION)
        .findOne({ trip_id: tripId, student_id: { $in: studentIds } });

      return !!tripStudent;
    } catch {
      return false;
    }
  }

  /**
   * Get parent_id (MongoDB _id) from user_id for room joining
   */
  private async getParentIdFromUserId(userId: string): Promise<string | null> {
    try {
      const db = await getDB();
      const parent = await db
        .collection(PARENTS_COLLECTION)
        .findOne({ user_id: userId });
      return parent ? String(parent._id) : null;
    } catch {
      return null;
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
    this.io.on("connection", async (socket: Socket) => {
      const { userId, role } = socket.data;
      logger.info(`[Socket] Connected: ${userId} (${role})`);

      // Auto-join parents to their personal room for direct notifications
      if (role === UserRole.PARENT) {
        const parentId = await this.getParentIdFromUserId(userId);
        if (parentId) {
          socket.join(`parent:${parentId}`);
          socket.data.parentId = parentId;
        }
      }
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

          const roomName = `trip:${tripId}`;
          socket.join(roomName);
          const socketsInRoom = this.io.sockets.adapter.rooms.get(roomName);
          const roomSize = socketsInRoom ? socketsInRoom.size : 0;

          logger.info(
            `[Socket] Driver ${userId} joined trip:${tripId} | Clients: ${roomSize}`,
          );
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

          const roomName = `trip:${tripId}`;
          socket.join(roomName);
          const socketsInRoom = this.io.sockets.adapter.rooms.get(roomName);
          const roomSize = socketsInRoom ? socketsInRoom.size : 0;

          logger.info(
            `[Socket] Parent ${userId} joined trip:${tripId} | Clients: ${roomSize}`,
          );
          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.UPDATE_POSITION,
        async (
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

          const roomName = `trip:${tripId}`;
          const socketsInRoom = this.io.sockets.adapter.rooms.get(roomName);
          const roomSize = socketsInRoom ? socketsInRoom.size : 0;

          // Single log for position broadcast
          logger.info(
            `[Socket] 📍 Position | Trip: ${tripId} | Driver: ${userId} | (${latitude}, ${longitude}) | Clients: ${roomSize}`,
          );

          this.io.to(roomName).emit(BroadcastSocketEvent.POSITION_UPDATE, {
            tripId,
            driverId: userId,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0,
            timestamp: new Date(),
          });

          if (process.env.NODE_ENV === "dev") {
            try {
              const db = await getDB();
              const driver = await db
                .collection(DRIVERS_COLLECTION)
                .findOne({ user_id: userId });

              if (driver) {
                await trackingRepository.upsertTracking(tripId, {
                  trip_id: tripId,
                  driver_id: String(driver._id),
                  latitude,
                  longitude,
                  speed: speed || 0,
                  heading: heading || 0,
                  accuracy: accuracy || 0,
                  timestamp: new Date(),
                });
              }
            } catch (err) {
              logger.error(
                "[Socket][Dev] Failed to persist position:",
                err as object,
              );
            }
          }

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

          this.io.to(`trip:${tripId}`).emit(BroadcastSocketEvent.TRIP_STARTED, {
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
            .to(`trip:${tripId}`)
            .emit(BroadcastSocketEvent.TRIP_COMPLETED, {
              tripId,
              driverId: userId,
              timestamp: new Date(),
            });

          positionUpdateTimestamps.delete(tripId);
          socket.leave(`trip:${tripId}`);
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

          this.io.to(`trip:${tripId}`).emit(BroadcastSocketEvent.APPROACHING, {
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

          logger.info(
            `[Socket] Student Picked | Trip: ${tripId} | Student: ${studentId} | Driver: ${userId}`,
          );

          this.io
            .to(`trip:${tripId}`)
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

          logger.info(
            `[Socket] Student Dropped | Trip: ${tripId} | Student: ${studentId} | Driver: ${userId}`,
          );

          this.io
            .to(`trip:${tripId}`)
            .emit(BroadcastSocketEvent.STUDENT_DROPPED, {
              tripId,
              studentId,
              driverId: userId,
              timestamp: new Date(),
            });

          if (callback) callback(true);
        },
      );

      socket.on(
        ParentSocketEvent.UNSUBSCRIBE_TRIP,
        (tripId: string, callback?: (success: boolean) => void) => {
          socket.leave(`trip:${tripId}`);
          logger.info(`[Socket] Parent ${userId} left trip:${tripId}`);
          if (callback) callback(true);
        },
      );

      socket.on(
        DriverSocketEvent.UNSUBSCRIBE_TRIP,
        (tripId: string, callback?: (success: boolean) => void) => {
          socket.leave(`trip:${tripId}`);
          positionUpdateTimestamps.delete(tripId);
          logger.info(`[Socket] Driver ${userId} left trip:${tripId}`);
          if (callback) callback(true);
        },
      );

      socket.on("disconnect", () => {
        logger.info(`[Socket] Disconnected: ${userId} (${role})`);
      });

      socket.on("error", (error) => {
        logger.error(`[Socket] Error: ${userId}`, error);
      });
    });
  }

  public broadcastToTrip(
    tripId: string,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    this.io.to(`trip:${tripId}`).emit(event, data);
  }

  public notifyDriver(
    tripId: string,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    this.io.to(`trip:${tripId}`).emit(event, data);
  }

  /**
   * Send event to a specific parent by their parent_id (MongoDB _id from parents collection)
   * Used for parent-specific notifications like their child's pickup/drop
   */
  public emitToParent(
    parentId: string,
    event: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: Record<string, any>,
  ) {
    this.io.to(`parent:${parentId}`).emit(event, data);
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
