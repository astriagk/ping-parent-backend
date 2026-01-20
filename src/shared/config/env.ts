import dotenv from "dotenv";
import path from "path";

// 1. Determine environment
const NODE_ENV = process.env.NODE_ENV || "dev";

// 2. Load the correct .env file from project root
// Using process.cwd() ensures it works in dev and prod
const envFile = `.env.${NODE_ENV}`;
const envPath = path.resolve(process.cwd(), "environment", envFile);

// 3. Load environment variables
dotenv.config({ path: envPath });

// 4. Export typed environment variables
export const ENV = {
  NODE_ENV,
  PORT: Number(process.env.PORT) || 3000,
  MONGO_URI: process.env.MONGO_URI!,
  DB_NAME: process.env.DB_NAME!,
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  EMAIL_HOST: process.env.EMAIL_HOST!,
  EMAIL_PORT: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  EMAIL_USER: process.env.EMAIL_USER!,
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD!,
  EMAIL_FROM: process.env.EMAIL_FROM!,
} as const;

// 5. Validate required environment variables
const requiredEnvVars = ["MONGO_URI", "DB_NAME", "JWT_SECRET"];
requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});
