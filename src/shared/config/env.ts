import dotenv from "dotenv";
import path from "path";

// Load environment variables dynamically based on NODE_ENV
const env = process.env.NODE_ENV || "dev";
const envFile = `.env.${env}`;
const envPath = path.join(__dirname, "../../environment", envFile);

dotenv.config({ path: envPath });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "dev",
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI as string,
  DB_NAME: process.env.DB_NAME as string,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET as string,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  EMAIL_HOST: process.env.EMAIL_HOST as string,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  EMAIL_USER: process.env.EMAIL_USER as string,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD as string,
  EMAIL_FROM: process.env.EMAIL_FROM as string,
} as const;

// Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "DB_NAME", "JWT_SECRET"];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
