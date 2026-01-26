import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000";
const ADMIN_URL = process.env.ADMIN_CORS || "http://localhost:7001";
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";
const AUTH_CORS = process.env.AUTH_CORS || "http://localhost:7001,http://localhost:8000";
const DATABASE_URL = process.env.DATABASE_URL || "postgresql://medusa:medusa@localhost:5432/medusa_db";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const workerMode = process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server" || "shared";

export default defineConfig({
  projectConfig: {
    databaseUrl: DATABASE_URL,
    http: {
      storeCors: STORE_CORS,
      adminCors: ADMIN_CORS,
      authCors: AUTH_CORS,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: workerMode,
    redisUrl: REDIS_URL,
  },
  admin: {
    path: "/app",
    backendUrl: BACKEND_URL,
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },
  modules: [
    {
      resolve: "@medusajs/event-bus-redis",
      options: {
        redisUrl: REDIS_URL,
      },
    },
    {
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: REDIS_URL,
        ttl: 30,
      },
    },
    {
      resolve: "@medusajs/workflow-engine-redis",
      options: {
        redis: {
          url: REDIS_URL,
        },
      },
    },
    {
      resolve: "@medusajs/file-local",
      options: {
        uploadDir: "uploads",
        backendUrl: BACKEND_URL,
      },
    },
  ],
});
