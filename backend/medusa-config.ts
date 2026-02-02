import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

/**
 * Medusa v2 Production Configuration
 * Sam Nghe Thay Cu E-commerce Platform
 *
 * GOLDEN ARCHITECTURE:
 * - Server/Worker split via MEDUSA_WORKER_MODE
 * - Admin serves at /app path (matches Traefik routing)
 * - WORKDIR /app/server (Dockerfile aligns with build output)
 */
export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,

    // Database SSL configuration
    databaseDriverOptions: {
      connection: {
        ssl: false, // Set to true for cloud databases (AWS RDS, etc.)
      },
    },

    // Redis configuration
    redisUrl: process.env.REDIS_URL || "redis://localhost:6379",

    // CRITICAL: Worker mode for server/worker split
    // - "server": Handles HTTP requests (API + Admin)
    // - "worker": Handles background jobs
    // - "shared": Single process mode (development only)
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",

    // HTTP Configuration
    http: {
      // Store CORS (storefront domains)
      storeCors: process.env.STORE_CORS ||
        "https://samnghethaycu.com,https://www.samnghethaycu.com,http://localhost:3000,http://localhost:8000",

      // Admin CORS (admin dashboard domain)
      adminCors: process.env.ADMIN_CORS ||
        "https://admin.samnghethaycu.com,http://localhost:7001,http://localhost:7000",

      // Auth CORS (all authenticated endpoints)
      authCors: process.env.AUTH_CORS ||
        "https://samnghethaycu.com,https://www.samnghethaycu.com,https://admin.samnghethaycu.com,http://localhost:3000,http://localhost:7001",

      // Security secrets
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

  /**
   * CRITICAL: Admin Panel Configuration
   *
   * GOLDEN ARCHITECTURE:
   * - path: "/app" → Admin UI served at this URL path (matches Traefik routing)
   * - backendUrl: Production API URL (browser needs to reach this)
   * - disable: Controlled by DISABLE_MEDUSA_ADMIN env (worker doesn't need admin)
   */
  admin: {
    // CRITICAL: Must match Traefik routing path
    path: "/app",

    // Backend URL for API calls from admin dashboard
    backendUrl: process.env.MEDUSA_BACKEND_URL || "https://api.samnghethaycu.com",

    // Disable admin for worker process (saves memory)
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
  },

  /**
   * Modules Configuration
   */
  modules: [
    {
      key: "cache",
      resolve: "@medusajs/cache-redis",
      options: {
        redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
        ttl: 30, // Cache TTL in seconds
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
      key: "file",
      resolve: "@medusajs/file-local",
      options: {
        // Files uploaded to /app/server/uploads (matches Docker volume mount)
        upload_dir: "uploads",
        backend_url: process.env.MEDUSA_BACKEND_URL || "https://api.samnghethaycu.com",
      },
    },
  ],

  /**
   * Feature Flags (Medusa v2)
   */
  featureFlags: {
    // Enable product categories
    product_categories: true,
  },
});
