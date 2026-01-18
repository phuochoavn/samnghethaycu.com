import { defineConfig, loadEnv } from "@medusajs/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

/**
 * Medusa v2 Configuration
 * Sam Nghe Thay Cu E-commerce Platform
 */
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000,http://localhost:8000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:7001,http://localhost:7000",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    // Quan trọng: Định nghĩa Redis URL ở đây cho worker dùng chung
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },
  admin: {
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
  },
  modules: [
    {
      key: "cache",
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
        ttl: 30,
      },
    },
    {
      key: "event_bus",
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
      },
    },
    {
      key: "workflow_engine",
      resolve: "@medusajs/workflow-engine-redis",
      options: {
        redis: {
          url: process.env.REDIS_URL || "redis://localhost:6379",
        },
      },
    },
  ],
});