import { getRedisClient } from "@shared/config";

export class RedisService {
  async set(key: string, value: string, expirySeconds?: number): Promise<void> {
    const client = getRedisClient();
    if (expirySeconds) {
      await client.setEx(key, expirySeconds, value);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = getRedisClient();
    return await client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    await client.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const client = getRedisClient();
    const result = await client.exists(key);
    return result === 1;
  }

  async setJSON(
    key: string,
    value: object,
    expirySeconds?: number,
  ): Promise<void> {
    await this.set(key, JSON.stringify(value), expirySeconds);
  }

  async getJSON<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    return value ? JSON.parse(value) : null;
  }

  async setOTP(phone: string, otp: string, expirySeconds = 300): Promise<void> {
    await this.set(`otp:${phone}`, otp, expirySeconds);
  }

  async getOTP(phone: string): Promise<string | null> {
    return await this.get(`otp:${phone}`);
  }

  async deleteOTP(phone: string): Promise<void> {
    await this.del(`otp:${phone}`);
  }
}

export const redisService = new RedisService();
