import authRoutes from "@routes/auth.routes";
import parentRoutes from "@routes/parent.routes";
import express, { Request, Response, NextFunction } from "express";

const app = express();

app.use(express.json());

console.log("testing middleware");

app.use((req: Request, _res: Response, next: NextFunction) => {
  const time = new Date().toISOString();
  console.log(`[${time}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api", authRoutes);
app.use("/api", parentRoutes);

export default app;
