/* eslint-disable no-console */
import dotenv from "dotenv";
import { createServer, get as httpGet } from "http";
import path from "path";

import { startSubscriptionExpiryCron } from "@modules/billing/parent_subscription/parent_subscription.cron";
import { connectDB } from "@shared/config";
import { initializeFirebase } from "@shared/services/fcm.service";
import { initializeSocket } from "@shared/services/socket.service";

import app from "./app";

const NODE_ENV = process.env.NODE_ENV || "dev";

// Load environment-specific configuration
const envFile = `.env.${NODE_ENV}`;
dotenv.config({
  path: path.join(process.cwd(), "environment", envFile),
});

console.log("ENV:", NODE_ENV);
console.log("MONGO_URI:", process.env.MONGO_URI);

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0"; // Bind to all network interfaces

async function startServer() {
  try {
    await connectDB();
    // await connectRedis();
    initializeFirebase();
    const httpServer = createServer(app);

    // Initialize Socket.IO for real-time tracking
    initializeSocket(httpServer);

    // Start subscription expiry cron job
    // startSubscriptionExpiryCron();

    httpServer.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`🌱 Environment: ${NODE_ENV}`);
      console.log("📱 Accessible from network devices");
      console.log("🔌 WebSocket (Socket.IO) enabled for real-time tracking");

      setInterval(() => {
        httpGet(`http://localhost:${PORT}/api/public/ping`, (res) => {
          console.log(
            `[keep-alive] ping ${new Date().toISOString()} — status ${res.statusCode}`,
          );
        }).on("error", (err) => {
          console.error("[keep-alive] ping failed:", err.message);
        });
      }, 20_000);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
