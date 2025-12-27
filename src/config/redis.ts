/* eslint-disable no-console */
import { RedisClientType, createClient } from "redis";

let redisClient: RedisClientType;

export const connectRedis = async (): Promise<RedisClientType> => {
  if (redisClient) return redisClient;

  redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379",
  });

  redisClient.on("error", (err) => console.error("❌ Redis Client Error", err));
  redisClient.on("connect", () => console.log("✅ Redis connected"));

  await redisClient.connect();

  return redisClient;
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error("Redis not initialized. Call connectRedis first.");
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
  }
};
