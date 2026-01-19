import { defineConfig, loadEnv } from "@medusajs/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

/**
 * Medusa v2 Production Configuration
 * Sam Nghe Thay Cu E-commerce Platform
 *
 * CRITICAL: This config ensures Admin Panel is built in Docker/CI environments
 */
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: {
      connection: {
        ssl: false, // Docker PostgreSQL doesn't use SSL
      },
    },
    http: {
      // CORS - Production domains with localhost fallback for dev
      storeCors: process.env.STORE_CORS ||
        "https://samnghethaycu.com,https://www.samnghethaycu.com,http://localhost:3000,http://localhost:8000",
      adminCors: process.env.ADMIN_CORS ||
        "https://admin.samnghethaycu.com,http://localhost:7001,http://localhost:7000",
      authCors: process.env.AUTH_CORS ||
        "https://samnghethaycu.com,https://www.samnghethaycu.com,https://admin.samnghethaycu.com,http://localhost:3000,http://localhost:7001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
  },

  /**
   * CRITICAL: Admin Panel Configuration
   *
   * SHOTGUN APPROACH: Let Medusa use ALL defaults for paths.
   * Dockerfile will place admin build in EVERY possible location.
   *
   * - disable: false → FORCES admin build in Docker/CI environments
   * - backendUrl: Production API URL (browser needs to reach this)
   */
  admin: {
    disable: false, // ✅ CRITICAL: Force admin build
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://api.samnghethaycu.com",
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
  ],
});