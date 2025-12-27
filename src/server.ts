import dotenv from "dotenv";
import { createServer } from "http";
import path from "path";

import app from "./app";
import { connectDB } from "./config/database";
import { connectRedis } from "./config/redis";

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
    const server = createServer(app);
    server.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on http://${HOST}:${PORT}`);
      console.log(`🌱 Environment: ${NODE_ENV}`);
      console.log("📱 Accessible from network devices");
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
}

startServer();
