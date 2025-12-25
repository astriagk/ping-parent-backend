import authRoutes from "@routes/auth.routes";
import driverRoutes from "@routes/driver.routes";
import parentRoutes from "@routes/parent.routes";
import express, { Request, Response, NextFunction } from "express";

const app = express();

app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", authRoutes);
app.use("/api", driverRoutes);
app.use("/api", parentRoutes);

export default app;
