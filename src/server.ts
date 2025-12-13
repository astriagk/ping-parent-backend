import dotenv from "dotenv";
import path from "path";

const NODE_ENV = process.env.NODE_ENV || "dev";

dotenv.config({
  path: path.join(process.cwd(), "environment", ".env.dev"),
});

console.log("ENV:", NODE_ENV);
console.log("MONGO_URI:", process.env.MONGO_URI);

import app from "./app";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌱 Environment: ${NODE_ENV}`);
});
