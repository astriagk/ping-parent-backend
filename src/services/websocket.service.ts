import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../utils/jwt";
import { updateTripLocation, updateTripStatus, completeStop } from "./trip.service";
import { createNotification } from "./notification.service";

let io: SocketIOServer | null = null;

export const initializeWebSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: Token required"));
    }

    try {
      const decoded = verifyToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    console.log(`User connected: ${user.userId} (${user.email})`);

    socket.join(`user:${user.userId}`);

    socket.on("trip:location:update", async (data) => {
      try {
        const { tripId, coordinates } = data;

        if (!tripId || !coordinates) {
          return socket.emit("error", { message: "Invalid location update data" });
        }

        const updated = await updateTripLocation(tripId, {
          coordinates,
          timestamp: new Date(),
        });

        if (updated) {
          io?.emit("trip:location:changed", {
            tripId,
            coordinates,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error("Error updating trip location:", error);
        socket.emit("error", { message: "Failed to update trip location" });
      }
    });

    socket.on("trip:status:update", async (data) => {
      try {
        const { tripId, status, parentId } = data;

        if (!tripId || !status) {
          return socket.emit("error", { message: "Invalid status update data" });
        }

        const updated = await updateTripStatus(tripId, status);

        if (updated) {
          io?.emit("trip:status:changed", {
            tripId,
            status,
            timestamp: new Date(),
          });

          const notificationMessages: { [key: string]: { title: string; message: string } } = {
            ongoing: {
              title: "Trip Started",
              message: "Your child's trip has started",
            },
            completed: {
              title: "Trip Completed",
              message: "Your child's trip has been completed successfully",
            },
            cancelled: {
              title: "Trip Cancelled",
              message: "Your child's trip has been cancelled",
            },
          };

          if (parentId && notificationMessages[status]) {
            await createNotification({
              userId: parentId,
              parentId,
              type: status === "ongoing" ? "trip_started" : "trip_ended",
              title: notificationMessages[status].title,
              message: notificationMessages[status].message,
              relatedEntityType: "trip",
              relatedEntityId: tripId,
              status: "unread",
              priority: "medium",
              createdAt: new Date(),
            });

            io?.to(`user:${parentId}`).emit("notification:new", {
              title: notificationMessages[status].title,
              message: notificationMessages[status].message,
              type: status === "ongoing" ? "trip_started" : "trip_ended",
            });
          }
        }
      } catch (error) {
        console.error("Error updating trip status:", error);
        socket.emit("error", { message: "Failed to update trip status" });
      }
    });

    socket.on("trip:stop:complete", async (data) => {
      try {
        const { tripId, studentId, parentId } = data;

        if (!tripId || !studentId) {
          return socket.emit("error", { message: "Invalid stop completion data" });
        }

        const updated = await completeStop(tripId, studentId);

        if (updated) {
          io?.emit("trip:stop:completed", {
            tripId,
            studentId,
            timestamp: new Date(),
          });

          if (parentId) {
            await createNotification({
              userId: parentId,
              parentId,
              type: "stop_completed",
              title: "Stop Completed",
              message: "Your child has been picked up/dropped off",
              relatedEntityType: "trip",
              relatedEntityId: tripId,
              status: "unread",
              priority: "high",
              createdAt: new Date(),
            });

            io?.to(`user:${parentId}`).emit("notification:new", {
              title: "Stop Completed",
              message: "Your child has been picked up/dropped off",
              type: "stop_completed",
            });
          }
        }
      } catch (error) {
        console.error("Error completing stop:", error);
        socket.emit("error", { message: "Failed to complete stop" });
      }
    });

    socket.on("trip:approaching", async (data) => {
      try {
        const { tripId, studentId, parentId, estimatedArrival } = data;

        if (!tripId || !studentId || !parentId) {
          return socket.emit("error", { message: "Invalid approaching data" });
        }

        io?.to(`user:${parentId}`).emit("trip:approaching", {
          tripId,
          studentId,
          estimatedArrival,
          timestamp: new Date(),
        });

        await createNotification({
          userId: parentId,
          parentId,
          type: "alert",
          title: "Driver Approaching",
          message: `The driver is approaching your child's location. ETA: ${estimatedArrival || "Soon"}`,
          relatedEntityType: "trip",
          relatedEntityId: tripId,
          status: "unread",
          priority: "high",
          createdAt: new Date(),
        });

        io?.to(`user:${parentId}`).emit("notification:new", {
          title: "Driver Approaching",
          message: `The driver is approaching your child's location. ETA: ${estimatedArrival || "Soon"}`,
          type: "alert",
        });
      } catch (error) {
        console.error("Error emitting approaching event:", error);
        socket.emit("error", { message: "Failed to emit approaching event" });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.userId}`);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToAll = (event: string, data: any) => {
  if (io) {
    io.emit(event, data);
  }
};
