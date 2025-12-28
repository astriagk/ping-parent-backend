declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "dev" | "production" | "test";
      PORT: string;
      MONGO_URI: string;
      DB_NAME: string;
      REDIS_URL: string;
      JWT_SECRET: string;
      JWT_EXPIRES_IN: string;
      REFRESH_TOKEN_EXPIRES_IN: string;
      EMAIL_HOST: string;
      EMAIL_PORT: string;
      EMAIL_USER: string;
      EMAIL_PASSWORD: string;
      EMAIL_FROM: string;
      FRONTEND_URL: string;
    }
  }
}

export {};
