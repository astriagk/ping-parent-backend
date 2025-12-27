import express, { NextFunction, Request, Response } from "express";

import { errorHandler, notFound } from "@middlewares";
import apiRoutes from "@routes";
import { logger } from "@utils";

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toISOString();
  logger.info(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", apiRoutes);

// 404 handler - must come after all routes
app.use(notFound);

// Error handler - must be the last middleware
app.use(errorHandler);

export default app;
