# Medusa V2 Admin Runtime Fix

## THE PROBLEM

### Symptoms
- ✅ Build Stage: SUCCESS (admin builds to `dist/public/admin/index.html`)
- ✅ Migration Stage: SUCCESS (all tables created)
- ❌ Runtime Stage: FAILED with error:
  ```
  Could not find index.html in the admin build directory.
  Make sure to run 'medusa build' before starting the server.
  ```

### Root Cause
**Medusa v2's runtime server looks for the admin build in `.medusa/admin/`, NOT `dist/public/admin/`**

During `medusa build`, the admin panel is built to **`.medusa/admin/`** directory, but our Dockerfile was only copying the `dist/` folder to the production image, missing the `.medusa/` folder entirely.

## THE SOLUTION

### 1. Dockerfile Changes

**Before:**
```dockerfile
# Only copied dist/ folder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/medusa-config.ts ./
```

**After:**
```dockerfile
# Copy BOTH dist/ AND .medusa/ folders
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.medusa ./.medusa  # ← CRITICAL: Admin build location
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/medusa-config.ts ./
COPY --from=builder /app/tsconfig.json ./    # ← Fixes "Couldn't find tsconfig.json"
```

### 2. medusa-config.ts Changes

**Added explicit admin configuration:**
```typescript
admin: {
  disable: false,           // Force admin build in Docker/CI
  path: "/app",            // Admin UI served at /app path
  outDir: ".medusa/admin", // Runtime location for admin build
  backendUrl: process.env.MEDUSA_BACKEND_URL || "https://api.samnghethaycu.com",
}
```

## MEDUSA V2 BUILD OUTPUT STRUCTURE

When you run `medusa build`, it creates:

```
.medusa/
├── admin/              ← 🎯 RUNTIME LOCATION (server looks here)
│   ├── index.html     ← Entry point
│   ├── assets/        ← JS/CSS bundles
│   └── ...
├── client/            ← Development files
└── types/             ← TypeScript definitions

dist/
├── api/               ← Compiled backend code
├── medusa-config.js   ← Compiled config
└── modules/           ← Custom modules
```

## HOW MEDUSA SERVES THE ADMIN

1. **Build Time:** `medusa build` compiles admin to `.medusa/admin/`
2. **Runtime:** Medusa's `serveProductionBuild` loader looks for admin at `.medusa/admin/index.html`
3. **URL:** Admin UI accessible at `https://api.samnghethaycu.com/app` (configured via `admin.path`)

## VERIFICATION STEPS

### Build Stage Verification
```bash
# During Docker build, you should see:
=== VERIFYING BUILD OUTPUT ===
Backend build:
drwxr-xr-x dist/

Admin build (.medusa/admin - runtime location):
drwxr-xr-x .medusa/admin/
-rw-r--r-- index.html
✓ Admin panel found at .medusa/admin/index.html
```

### Production Image Verification
```bash
# In production image:
=== PRODUCTION IMAGE VERIFICATION ===
Checking .medusa/admin (runtime location):
drwxr-xr-x .medusa/admin/
-rw-r--r-- index.html
✓ Admin panel verified at .medusa/admin/index.html

Checking backend dist:
drwxr-xr-x dist/
✓ Production image ready
```

### Runtime Verification
```bash
# After deployment:
docker exec samnghethaycu_backend ls -la .medusa/admin
# Should show: index.html, assets/, etc.

# Access admin:
https://api.samnghethaycu.com/app
# Or via Traefik routing:
https://admin.samnghethaycu.com
```

## KEY TAKEAWAYS

1. **Admin Build Location:** `.medusa/admin/` (NOT `dist/public/admin/`)
2. **Must Copy:** Both `dist/` and `.medusa/` to production image
3. **Admin Path:** Served at `/app` by default (configurable via `admin.path`)
4. **Config File:** `tsconfig.json` needed for proper runtime operation
5. **Verification:** Check `.medusa/admin/index.html` exists in container

## DEPLOYMENT CHECKLIST

- [x] Dockerfile copies `.medusa/admin/` to production image
- [x] Dockerfile copies `tsconfig.json` to production image
- [x] medusa-config.ts has `admin.disable: false`
- [x] medusa-config.ts has `admin.outDir: ".medusa/admin"`
- [x] Build verification checks `.medusa/admin/index.html` exists
- [x] Runtime verification confirms admin accessible at `/app`

## TRAEFIK ROUTING

With our Traefik setup, the admin is accessible via two URLs:

1. **Direct Backend:** `https://api.samnghethaycu.com/app`
2. **Admin Subdomain:** `https://admin.samnghethaycu.com` (via Traefik routing)

Both route to the same admin build served from `.medusa/admin/` on port 9000.
