import { Server as HTTPServer } from "http";
import { Socket, Server as SocketIOServer } from "socket.io";

import { logger } from "@shared/utils";

export class SocketService {
  private io: SocketIOServer;
  private activeTrips = new Map<string, Set<string>>(); // tripId -> Set of connected parent/driver socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  private setupMiddleware() {
    // Authenticate socket connections
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;
      const userId = socket.handshake.auth.userId;
      const role = socket.handshake.auth.role; // 'driver' or 'parent'

      if (!token || !userId || !role) {
        return next(new Error("Invalid authentication"));
      }

      socket.data = { userId, role, token };
      next();
    });
  }

  private setupConnectionHandlers() {
    this.io.on("connection", (socket: Socket) => {
      const { userId, role } = socket.data;
      logger.info(
        `User ${userId} (${role}) connected with socket ${socket.id}`,
      );

      // Driver subscribes to trip
      socket.on(
        "driver:subscribe_trip",
        (tripId: string, callback: (success: boolean) => void) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          socket.join(`trip:${tripId}:driver`);
          logger.info(`Driver ${userId} subscribed to trip ${tripId}`);
          callback(true);
        },
      );

      // Parent subscribes to trip tracking
      socket.on(
        "parent:subscribe_trip",
        (tripId: string, callback: (success: boolean) => void) => {
          if (socket.data.role !== "parent") {
            return callback(false);
          }

          socket.join(`trip:${tripId}:tracking`);
          logger.info(`Parent ${userId} subscribed to trip tracking ${tripId}`);
          callback(true);
        },
      );

      // Driver sends current position
      socket.on(
        "driver:update_position",
        (
          data: {
            tripId: string;
            latitude: number;
            longitude: number;
            speed?: number;
            heading?: number;
            accuracy?: number;
          },
          callback: (success: boolean) => void,
        ) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          const { tripId, latitude, longitude, speed, heading, accuracy } =
            data;

          // Broadcast position to all parents tracking this trip
          this.io.to(`trip:${tripId}:tracking`).emit("trip:position_update", {
            tripId,
            driverId: userId,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            accuracy: accuracy || 0,
            timestamp: new Date(),
          });

          logger.debug(
            `Position update for trip ${tripId}: ${latitude}, ${longitude}`,
          );
          callback(true);
        },
      );

      // Driver signals trip started
      socket.on(
        "driver:trip_started",
        (tripId: string, callback: (success: boolean) => void) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          this.io.to(`trip:${tripId}:tracking`).emit("trip:started", {
            tripId,
            driverId: userId,
            timestamp: new Date(),
          });

          logger.info(`Trip ${tripId} started by driver ${userId}`);
          callback(true);
        },
      );

      // Driver signals trip completed
      socket.on(
        "driver:trip_completed",
        (tripId: string, callback: (success: boolean) => void) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          this.io.to(`trip:${tripId}:tracking`).emit("trip:completed", {
            tripId,
            driverId: userId,
            timestamp: new Date(),
          });

          socket.leave(`trip:${tripId}:driver`);
          logger.info(`Trip ${tripId} completed by driver ${userId}`);
          callback(true);
        },
      );

      // Driver signals approaching waypoint/student
      socket.on(
        "driver:approaching_waypoint",
        (
          data: { tripId: string; studentId: string; eta: number },
          callback: (success: boolean) => void,
        ) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          const { tripId, studentId, eta } = data;

          this.io.to(`trip:${tripId}:tracking`).emit("trip:approaching", {
            tripId,
            studentId,
            eta,
            driverId: userId,
            timestamp: new Date(),
          });

          logger.info(
            `Driver ${userId} approaching student ${studentId} on trip ${tripId}`,
          );
          callback(true);
        },
      );

      // Driver signals student picked up
      socket.on(
        "driver:student_picked",
        (
          data: { tripId: string; studentId: string },
          callback: (success: boolean) => void,
        ) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          const { tripId, studentId } = data;

          this.io.to(`trip:${tripId}:tracking`).emit("trip:student_picked", {
            tripId,
            studentId,
            driverId: userId,
            timestamp: new Date(),
          });

          logger.info(`Student ${studentId} picked up on trip ${tripId}`);
          callback(true);
        },
      );

      // Driver signals student dropped off
      socket.on(
        "driver:student_dropped",
        (
          data: { tripId: string; studentId: string },
          callback: (success: boolean) => void,
        ) => {
          if (socket.data.role !== "driver") {
            return callback(false);
          }

          const { tripId, studentId } = data;

          this.io.to(`trip:${tripId}:tracking`).emit("trip:student_dropped", {
            tripId,
            studentId,
            driverId: userId,
            timestamp: new Date(),
          });

          logger.info(`Student ${studentId} dropped off on trip ${tripId}`);
          callback(true);
        },
      );

      // Parent unsubscribes from trip
      socket.on("parent:unsubscribe_trip", (tripId: string) => {
        socket.leave(`trip:${tripId}:tracking`);
        logger.info(`Parent ${userId} unsubscribed from trip ${tripId}`);
      });

      // Driver unsubscribes from trip
      socket.on("driver:unsubscribe_trip", (tripId: string) => {
        socket.leave(`trip:${tripId}:driver`);
        logger.info(`Driver ${userId} unsubscribed from trip ${tripId}`);
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        logger.info(
          `User ${userId} (${socket.data.role}) disconnected from socket ${socket.id}`,
        );
      });

      // Error handling
      socket.on("error", (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  /**
   * Emit event to all parents tracking a specific trip
   */
  public broadcastToTrip(tripId: string, event: string, data: any) {
    this.io.to(`trip:${tripId}:tracking`).emit(event, data);
  }

  /**
   * Emit event to driver of a specific trip
   */
  public notifyDriver(tripId: string, event: string, data: any) {
    this.io.to(`trip:${tripId}:driver`).emit(event, data);
  }

  /**
   * Get Socket.IO instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export let socketService: SocketService;

export const initializeSocket = (server: HTTPServer): SocketService => {
  socketService = new SocketService(server);
  return socketService;
};
