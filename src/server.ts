import dotenv from "dotenv";
import path from "path";

const NODE_ENV = process.env.NODE_ENV || "dev";

dotenv.config({
  path: path.join(process.cwd(), "environment", ".env.dev"),
});

console.log("ENV:", NODE_ENV);
console.log("MONGO_URI:", process.env.MONGO_URI);

import app from "./app";
import { createServer } from "http";
import { initializeWebSocket } from "./services/websocket.service";

const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0"; // Bind to all network interfaces

const server = createServer(app);

initializeWebSocket(server);

server.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`🌱 Environment: ${NODE_ENV}`);
  console.log(`📱 Accessible from network devices`);
  console.log(`🔌 WebSocket server initialized`);
});
