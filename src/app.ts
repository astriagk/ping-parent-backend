import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import * as path from "path";
import * as swaggerUi from "swagger-ui-express";

import apiRoutes from "@routes";
import { swaggerDocument, swaggerOptions } from "@shared/config";
import { errorHandler, notFound } from "@shared/middlewares";
import { logger } from "@shared/utils";

const app = express();

// TODO: Configure CORS properly for production
// Enable CORS for development
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: [
        "http://localhost:4200", // React default
        "http://127.0.0.1:4200",
      ],
      credentials: true,
    }),
  );
}

app.use(express.json());

// Serve uploaded files locally (only for local storage provider)
if (process.env.STORAGE_PROVIDER === "local") {
  const uploadDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadDir));
  logger.info("Local file storage enabled - serving uploads from /uploads");
}

app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toISOString();
  logger.info(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Swagger UI documentation route
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, swaggerOptions),
);

app.use("/api", apiRoutes);

// 404 handler - must come after all routes
app.use(notFound);

// Error handler - must be the last middleware
app.use(errorHandler);

export default app;
