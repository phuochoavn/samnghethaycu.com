# ZERO-DAY DEPLOYMENT GUIDE
## Medusa v2 Golden Architecture - Production Ready

This is the **DEFINITIVE** deployment guide for Medusa v2 on a VPS with Docker Compose and Traefik v3.

**Implements:**
- ✅ Golden Architecture (WORKDIR /app/server)
- ✅ Server/Worker Split
- ✅ No Volume Shadowing
- ✅ Traefik v3 Routing with Admin Redirect
- ✅ Production Security Best Practices

---

## PREREQUISITES

### 1. VPS Requirements
- Ubuntu 20.04+ or Debian 11+
- Minimum: 2 CPU cores, 4GB RAM, 20GB SSD
- Recommended: 4 CPU cores, 8GB RAM, 40GB SSD
- Docker & Docker Compose installed
- Root or sudo access

### 2. DNS Configuration
Point these domains to your VPS IP:
```
api.samnghethaycu.com → YOUR_VPS_IP
admin.samnghethaycu.com → YOUR_VPS_IP
samnghethaycu.com → YOUR_VPS_IP
www.samnghethaycu.com → YOUR_VPS_IP
```

### 3. Traefik Network
Traefik must already be running with the `traefik-public` network:

```bash
# Check if Traefik is running
docker ps | grep traefik

# Create network if it doesn't exist
docker network create traefik-public
```

---

## ZERO-DAY DEPLOYMENT STEPS

### Step 1: Clean Environment (CRITICAL)

```bash
# Stop all containers
docker-compose down

# Remove ALL containers
docker container prune -f

# Remove ALL volumes (WARNING: This deletes all data!)
docker volume prune -f

# Remove ALL images
docker image prune -af

# Verify clean state
docker ps -a
docker volume ls
docker image ls
```

### Step 2: Clone Repository

```bash
cd ~
git clone https://github.com/phuochoavn/samnghethaycu.com.git
cd samnghethaycu.com
git checkout claude/samnghethaycu-ecommerce-vv5kM
```

### Step 3: Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit with production values
nano .env
```

**Required Changes:**
```env
# Database
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Security (generate with: openssl rand -base64 32)
JWT_SECRET=YOUR_RANDOM_32_CHAR_STRING
COOKIE_SECRET=YOUR_RANDOM_32_CHAR_STRING

# Domains (verify these match your DNS)
MEDUSA_BACKEND_URL=https://api.samnghethaycu.com
ADMIN_CORS=https://admin.samnghethaycu.com
STORE_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com
```

**Generate Secure Secrets:**
```bash
# Generate JWT_SECRET
openssl rand -base64 32

# Generate COOKIE_SECRET
openssl rand -base64 32

# Copy these values to your .env file
```

### Step 4: Build Images

```bash
# Build backend (server + worker use same image)
docker-compose build --no-cache medusa-server

# Build storefront (if applicable)
docker-compose build --no-cache storefront
```

**Expected Build Output:**
```
=== BUILD VERIFICATION ===
drwxr-xr-x .medusa/server/

Admin build location:
drwxr-xr-x .medusa/server/public/admin/
-rw-r--r-- index.html
✓ Admin panel verified at .medusa/server/public/admin/index.html

=== PRODUCTION IMAGE VERIFICATION ===
/app/server

Directory structure:
drwxr-xr-x api/
drwxr-xr-x modules/
drwxr-xr-x public/
-rw-r--r-- package.json

Admin location (relative to WORKDIR):
drwxr-xr-x public/admin/
-rw-r--r-- index.html
✓ Production image ready - Admin at public/admin/index.html
```

### Step 5: Database Migration

```bash
# Start database and redis only
docker-compose up -d postgres redis

# Wait for database to be ready
docker-compose logs -f postgres
# Wait for: "database system is ready to accept connections"

# Run migrations
docker-compose run --rm medusa-server npm run medusa db:migrate

# Expected output:
# ✓ Migrations completed successfully
```

### Step 6: Create Admin User

```bash
docker-compose run --rm medusa-server npm run medusa user \
  -e admin@samnghethaycu.com \
  -p ChangeThisPassword123!

# Expected output:
# ✓ User created successfully
```

### Step 7: Start All Services

```bash
# Start server and worker
docker-compose up -d

# Watch logs
docker-compose logs -f medusa-server medusa-worker
```

**Expected Output:**
```
medusa-server    | Server is ready on port 9000
medusa-server    | Admin dashboard available at /app
medusa-worker    | Worker is ready
```

### Step 8: Verify Deployment

**1. Check Container Status:**
```bash
docker-compose ps

# Expected: All services "Up" (not "Restarting")
```

**2. Check WORKDIR:**
```bash
docker exec samnghethaycu_medusa_server pwd
# Expected: /app/server
```

**3. Check Admin Location:**
```bash
docker exec samnghethaycu_medusa_server ls -la public/admin
# Expected: index.html, assets/
```

**4. Check Health:**
```bash
# API Health
curl -I https://api.samnghethaycu.com/health
# Expected: HTTP 200 OK

# Admin (root - should redirect)
curl -I https://admin.samnghethaycu.com/
# Expected: HTTP 301 Moved Permanently
# Location: https://admin.samnghethaycu.com/app

# Admin (app path)
curl -I https://admin.samnghethaycu.com/app
# Expected: HTTP 200 OK
```

**5. Browser Test:**
```
Open: https://admin.samnghethaycu.com/

Expected:
1. Redirects to https://admin.samnghethaycu.com/app
2. Loads Medusa Admin UI login page
3. Login with admin@samnghethaycu.com
4. Dashboard loads successfully
```

---

## ARCHITECTURE OVERVIEW

### Directory Structure

```
/app/server/                 ← WORKDIR (Golden Architecture)
├── api/                     ← Backend code
├── modules/                 ← Custom modules
├── public/
│   └── admin/               ← Admin UI (native location)
│       ├── index.html
│       └── assets/
├── uploads/                 ← Mounted volume
├── package.json
└── medusa-config.js
```

### Service Architecture

```
┌─────────────────────────────────────────────┐
│            Traefik Reverse Proxy            │
│         (Port 80/443, SSL/TLS)              │
└──────────────┬──────────────┬───────────────┘
               │              │
               │              │
    ┌──────────▼─────┐  ┌────▼──────────┐
    │ medusa-server  │  │  storefront   │
    │ (WORKER_MODE:  │  │  (Next.js)    │
    │   server)      │  └───────────────┘
    │ Port 9000      │
    │ - API          │
    │ - Admin UI     │
    └────────┬───────┘
             │
    ┌────────▼───────┐
    │ medusa-worker  │
    │ (WORKER_MODE:  │
    │   worker)      │
    │ No HTTP port   │
    │ - Background   │
    │ - Jobs         │
    └────────┬───────┘
             │
    ┌────────▼───────┬──────────┐
    │   postgres     │  redis   │
    │   Port 5432    │  Port    │
    │                │  6379    │
    └────────────────┴──────────┘
```

### Traefik Routing

| Domain | Path | Target | Middleware |
|--------|------|--------|------------|
| `api.samnghethaycu.com` | `/` | medusa-server:9000 | None |
| `admin.samnghethaycu.com` | `/` | medusa-server:9000 | admin-redirect |
| `admin.samnghethaycu.com` | `/app` | medusa-server:9000 | None |
| `samnghethaycu.com` | `/` | storefront:3000 | None |

**Admin Redirect Middleware:**
```
Regex: ^https://admin\.samnghethaycu\.com/?$
Replacement: https://admin.samnghethaycu.com/app
Permanent: true
```

---

## GOLDEN ARCHITECTURE PRINCIPLES

### 1. WORKDIR Imperative
```dockerfile
WORKDIR /app/server  # ✅ Correct (where Medusa builds to)
# NOT /app           # ❌ Wrong (causes "Missing index.html")
```

### 2. Volume Hygiene
```yaml
volumes:
  - medusa_uploads:/app/server/uploads  # ✅ Correct (only uploads)
# NOT:
# - ./backend:/app                      # ❌ Wrong (volume shadowing)
```

### 3. Admin Path Configuration
```typescript
admin: {
  path: "/app",  // ✅ Matches Traefik routing
  backendUrl: "https://api.samnghethaycu.com",
}
```

### 4. Server/Worker Split
```yaml
medusa-server:
  environment:
    MEDUSA_WORKER_MODE: server  # ✅ Handles HTTP

medusa-worker:
  environment:
    MEDUSA_WORKER_MODE: worker  # ✅ Handles jobs
    DISABLE_MEDUSA_ADMIN: "true"
```

---

## TROUBLESHOOTING

### Issue: "Could not find index.html"

**Diagnosis:**
```bash
# Check WORKDIR
docker exec samnghethaycu_medusa_server pwd
# Must be: /app/server

# Check admin location
docker exec samnghethaycu_medusa_server ls -la public/admin/index.html
# Must exist

# Check for volume shadowing
docker inspect samnghethaycu_medusa_server | grep -A 10 Mounts
# Should only see: /app/server/uploads
```

**Solution:**
- Verify WORKDIR is `/app/server` in Dockerfile
- Ensure no `./backend:/app` volume mount
- Rebuild: `docker-compose build --no-cache medusa-server`

### Issue: Admin returns 404

**Diagnosis:**
```bash
# Check Traefik routing
curl -I https://admin.samnghethaycu.com/
# Should return: 301 Moved Permanently

curl -I https://admin.samnghethaycu.com/app
# Should return: 200 OK
```

**Solution:**
- Verify admin-redirect middleware in docker-compose.yml
- Check admin.path is "/app" in medusa-config.ts
- Restart: `docker-compose restart medusa-server`

### Issue: Container restart loop

**Diagnosis:**
```bash
# Check logs
docker-compose logs --tail=50 medusa-server

# Check database connection
docker exec samnghethaycu_medusa_server nc -zv postgres 5432
```

**Solution:**
- Verify DATABASE_URL in .env
- Ensure migrations ran successfully
- Check JWT_SECRET and COOKIE_SECRET are set

### Issue: Worker not processing jobs

**Diagnosis:**
```bash
# Check worker logs
docker-compose logs --tail=50 medusa-worker

# Check Redis connection
docker exec samnghethaycu_medusa_worker nc -zv redis 6379
```

**Solution:**
- Verify REDIS_URL in .env
- Ensure MEDUSA_WORKER_MODE=worker
- Restart: `docker-compose restart medusa-worker`

---

## MAINTENANCE

### Viewing Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f medusa-server
docker-compose logs -f medusa-worker

# Last N lines
docker-compose logs --tail=100 medusa-server
```

### Backup Database
```bash
# Create backup
docker exec samnghethaycu_postgres pg_dump -U medusa medusa_db > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20240101.sql | docker exec -i samnghethaycu_postgres psql -U medusa medusa_db
```

### Update Application
```bash
# Pull latest changes
git pull origin claude/samnghethaycu-ecommerce-vv5kM

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d

# Run new migrations if any
docker-compose exec medusa-server npm run medusa db:migrate
```

### Scale Workers
```bash
# Scale to 3 worker instances
docker-compose up -d --scale medusa-worker=3
```

---

## SECURITY CHECKLIST

- [x] Strong database password (20+ characters)
- [x] Unique JWT_SECRET and COOKIE_SECRET
- [x] CORS configured for specific domains
- [x] Non-root user in Docker containers
- [x] SSL/TLS via Traefik (Let's Encrypt)
- [x] No source code mounted in production
- [x] Health checks enabled
- [x] Database internal network only
- [x] Redis internal network only

---

## PERFORMANCE TUNING

### Database Connection Pool
```typescript
// backend/medusa-config.ts
databaseDriverOptions: {
  connection: {
    ssl: false,
  },
  pool: {
    min: 2,
    max: 10,
  },
}
```

### Redis Memory
```yaml
# docker-compose.yml
redis:
  command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
```

### Worker Scaling
```bash
# Monitor job queue
docker-compose logs medusa-worker | grep "Processing"

# Scale up if queue is backed up
docker-compose up -d --scale medusa-worker=3
```

---

## SUCCESS CRITERIA

Your deployment is successful when:

✅ All containers status: "Up"
✅ WORKDIR is `/app/server`
✅ Admin exists at `public/admin/index.html`
✅ API returns 200: `https://api.samnghethaycu.com/health`
✅ Admin redirects: `https://admin.samnghethaycu.com/` → `/app`
✅ Admin loads: `https://admin.samnghethaycu.com/app`
✅ Login works with created admin user
✅ Worker processing jobs (check logs)
✅ No restart loops
✅ No "Missing index.html" errors

---

## SUMMARY

This deployment implements the **Golden Architecture** discovered through extensive research:

1. **WORKDIR /app/server** - Aligns runtime with build output
2. **No Volume Shadowing** - Only mount uploads, never source code
3. **Server/Worker Split** - Scalable architecture with dedicated processes
4. **Admin Redirect** - Traefik middleware for UX
5. **Production Security** - Non-root users, SSL, internal networks

**This is not a workaround. This is how Medusa v2 is designed to work in production.**

Deploy with confidence. 🚀
