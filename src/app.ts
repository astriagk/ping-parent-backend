import express, { Request, Response, NextFunction } from "express";
import pingRoutes from "./routes/ping.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", pingRoutes);
app.use("/api", authRoutes);

export default app;
