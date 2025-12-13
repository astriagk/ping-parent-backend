import express from "express";
import pingRoutes from "./routes/ping.routes";

const app = express();

app.use(express.json());
app.use("/api", pingRoutes);

export default app;
