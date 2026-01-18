# Sam Nghe Thay Cu - Traefik Deployment Guide

**VPS IP**: 69.62.82.145
**Reverse Proxy**: Traefik (Already Running)
**Network**: traefik-public (External)
**Date**: 2026-01-18
**Phase**: Phase 2 - Traefik Integration

---

## 🎯 Overview

This project integrates with your **existing Traefik infrastructure** instead of installing a separate Nginx reverse proxy. This approach:

✅ **Prevents port conflicts** with existing services
✅ **Leverages existing SSL automation** (Let's Encrypt)
✅ **Maintains consistency** with other sites on the VPS
✅ **No additional configuration** - Traefik auto-discovers services

---

## 🏗️ Architecture

```
Internet (Port 443/80)
         ↓
    [Traefik Reverse Proxy]
    (Already Running)
    Container: 7d40400b690a
    Network: traefik-public
         ↓
    ┌────────────┬────────────┬────────────┐
    ↓            ↓            ↓            ↓
[Storefront] [Backend]   [Admin]    [Other Sites]
   :3000       :9000       :7001      (Laravel, etc.)
    ↓            ↓
    └──[Internal Network]──┘
              ↓
       [PostgreSQL]  [Redis]
         :5432       :6379
```

---

## 🔧 How It Works

### Domain Routing

Traefik uses **labels** in `docker-compose.yml` to automatically configure routing:

**1. Storefront** (`samnghethaycu.com`, `www.samnghethaycu.com`)
- Traefik detects label: `Host('samnghethaycu.com') || Host('www.samnghethaycu.com')`
- Routes HTTPS traffic to container port **3000**
- Auto-generates SSL certificate via Let's Encrypt

**2. Backend API** (`api.samnghethaycu.com`)
- Traefik detects label: `Host('api.samnghethaycu.com')`
- Routes HTTPS traffic to container port **9000**
- Auto-generates SSL certificate

**3. Admin Panel** (`admin.samnghethaycu.com`)
- Traefik detects label: `Host('admin.samnghethaycu.com')`
- Routes HTTPS traffic to container port **7001**
- Auto-generates SSL certificate

---

## 📋 Key Changes from Standard Setup

### 1. No Port Mappings ❌

**Before** (Nginx setup):
```yaml
ports:
  - "3000:3000"  # ❌ Exposed to host
  - "9000:9000"  # ❌ Exposed to host
  - "7001:7001"  # ❌ Exposed to host
```

**Now** (Traefik setup):
```yaml
# NO ports section!
# Services only accessible via Traefik
```

**Why?**
- Traefik accesses containers via internal Docker network
- No need to expose ports to host
- More secure (services not directly accessible)

---

### 2. Dual Network Configuration 🌐

Each public service (backend, storefront) connects to **TWO networks**:

```yaml
networks:
  - traefik-public      # External access via Traefik
  - samnghethaycu_network  # Internal DB/Redis access
```

**Why?**
- `traefik-public`: Required for Traefik to route traffic
- `samnghethaycu_network`: Required for backend to access postgres/redis

---

### 3. Traefik Labels 🏷️

Labels tell Traefik how to route traffic. Example for storefront:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.docker.network=traefik-public"
  - "traefik.http.routers.samnghethaycu-storefront.rule=Host(`samnghethaycu.com`) || Host(`www.samnghethaycu.com`)"
  - "traefik.http.routers.samnghethaycu-storefront.entrypoints=websecure"
  - "traefik.http.routers.samnghethaycu-storefront.tls.certresolver=le"
  - "traefik.http.services.samnghethaycu-storefront.loadbalancer.server.port=3000"
```

**Label Breakdown**:
- `traefik.enable=true`: Enable Traefik for this service
- `traefik.docker.network`: Which network Traefik should use
- `traefik.http.routers.*.rule`: Domain matching rule
- `traefik.http.routers.*.entrypoints=websecure`: Use HTTPS (port 443)
- `traefik.http.routers.*.tls.certresolver=le`: Use Let's Encrypt SSL
- `traefik.http.services.*.loadbalancer.server.port`: Container port

---

### 4. Production Environment Variables ✅

Updated for HTTPS production domains:

```env
# Backend
MEDUSA_BACKEND_URL=https://api.samnghethaycu.com
STORE_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com
ADMIN_CORS=https://admin.samnghethaycu.com

# Storefront
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.samnghethaycu.com
```

---

## 🚀 Deployment Steps

### Step 1: Verify Traefik is Running

```bash
# Check Traefik container
docker ps | grep traefik

# Expected output:
# 7d40400b690a   traefik:latest   ...   Up X hours   0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

**If Traefik is NOT running**, you'll need to start it first. Contact your VPS admin or refer to Traefik setup docs.

---

### Step 2: Verify `traefik-public` Network Exists

```bash
# List Docker networks
docker network ls | grep traefik

# Expected output:
# xxxxxxxxxx   traefik-public   bridge   ...
```

**If network doesn't exist**, create it:

```bash
docker network create traefik-public
```

---

### Step 3: Update Environment Variables

#### Backend `.env`

```bash
nano ~/samnghethaycu.com/backend/.env
```

**Update these values**:

```env
NODE_ENV=production

# Backend URL (HTTPS)
MEDUSA_BACKEND_URL=https://api.samnghethaycu.com

# CORS - Production domains only
STORE_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com
ADMIN_CORS=https://admin.samnghethaycu.com
AUTH_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com,https://admin.samnghethaycu.com

# Secrets (CHANGE THESE!)
JWT_SECRET=<generate-with-openssl-rand-base64-32>
COOKIE_SECRET=<generate-with-openssl-rand-base64-32>

# Database & Redis (keep as is - internal network)
DATABASE_URL=postgresql://medusa:medusa@postgres:5432/medusa_db
REDIS_URL=redis://redis:6379

# Worker Mode
MEDUSA_WORKER_MODE=shared
```

**Generate secrets**:
```bash
openssl rand -base64 32  # Use for JWT_SECRET
openssl rand -base64 32  # Use for COOKIE_SECRET
```

---

#### Storefront `.env`

```bash
nano ~/samnghethaycu.com/storefront/.env
```

**Update these values**:

```env
NODE_ENV=production

# Backend API URL (HTTPS)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.samnghethaycu.com

# Publishable Key (get from Medusa Admin after first login)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
```

---

### Step 4: Deploy with Docker Compose

```bash
# Navigate to project directory
cd ~/samnghethaycu.com

# Pull latest code (if needed)
git pull

# Stop existing containers (if running)
docker-compose down

# Start services with Traefik integration
docker-compose up -d

# Check if all containers are running
docker-compose ps
```

**Expected output**:
```
NAME                        STATUS
samnghethaycu_backend       Up
samnghethaycu_storefront    Up
samnghethaycu_postgres      Up (healthy)
samnghethaycu_redis         Up (healthy)
```

---

### Step 5: Verify Traefik Auto-Discovery

Traefik should automatically detect the new services within 30 seconds.

```bash
# Check Traefik logs for service discovery
docker logs <traefik-container-id> --tail 50 | grep samnghethaycu
```

**Expected**: You should see log entries showing Traefik discovered the routers and services.

---

### Step 6: Test HTTPS Access

```bash
# Test Storefront (should work immediately)
curl -I https://samnghethaycu.com

# Test Backend API
curl https://api.samnghethaycu.com/health

# Test Admin Panel
curl -I https://admin.samnghethaycu.com
```

**Expected**: All should return `HTTP/2 200` with valid SSL.

**If you get connection errors**:
- Wait 1-2 minutes for Traefik to generate SSL certificates
- Check Traefik logs: `docker logs <traefik-container-id>`
- Verify DNS records point to correct IP

---

### Step 7: Initialize Database (First Time Only)

```bash
# Run database migrations
docker-compose exec backend npx medusa db:migrate

# Create admin user
docker-compose exec backend npx medusa user -e admin@samnghethaycu.com -p supersecret
```

---

### Step 8: Access Admin Panel

1. Open browser: https://admin.samnghethaycu.com
2. Login with credentials from Step 7
3. Navigate to **Settings → Publishable API Keys**
4. Copy the publishable key
5. Update `storefront/.env` with the key:
   ```env
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_xxxxxxxxxxxxx
   ```
6. Restart storefront:
   ```bash
   docker-compose restart storefront
   ```

---

## 🔍 Verification Checklist

After deployment:

- [ ] All 4 Docker containers running (`docker-compose ps`)
- [ ] Traefik discovered services (check Traefik logs)
- [ ] https://samnghethaycu.com loads (Storefront)
- [ ] https://api.samnghethaycu.com/health returns success
- [ ] https://admin.samnghethaycu.com loads (Admin Panel)
- [ ] SSL certificates auto-generated (no browser warnings)
- [ ] HTTP redirects to HTTPS
- [ ] Admin login works
- [ ] Storefront can communicate with backend API

---

## 🐛 Troubleshooting

### Issue 1: "Network traefik-public not found"

**Symptoms**: `docker-compose up` fails with network error

**Solution**:
```bash
# Create the external network
docker network create traefik-public

# Then retry
docker-compose up -d
```

---

### Issue 2: Traefik Not Routing Traffic

**Symptoms**: 404 Not Found or Gateway Timeout

**Solution**:
1. Check Traefik container is running:
   ```bash
   docker ps | grep traefik
   ```

2. Check Traefik logs for errors:
   ```bash
   docker logs <traefik-container-id> --tail 100
   ```

3. Verify labels are correct:
   ```bash
   docker inspect samnghethaycu_backend | grep -A 20 Labels
   ```

4. Restart Traefik (if you have permission):
   ```bash
   docker restart <traefik-container-id>
   ```

---

### Issue 3: SSL Certificate Not Generated

**Symptoms**: Browser shows "Certificate not valid" or connection error

**Solution**:
1. Wait 1-2 minutes for Let's Encrypt to issue certificate
2. Check DNS records are correct:
   ```bash
   dig +short samnghethaycu.com  # Should return 69.62.82.145
   ```
3. Check Traefik logs for Let's Encrypt errors:
   ```bash
   docker logs <traefik-container-id> | grep -i "acme\|certificate"
   ```
4. Verify `certresolver=le` matches your Traefik configuration

---

### Issue 4: CORS Errors in Browser

**Symptoms**: Console shows "blocked by CORS policy"

**Solution**:
1. Verify CORS settings in `backend/.env`:
   ```env
   STORE_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com
   ADMIN_CORS=https://admin.samnghethaycu.com
   ```

2. Restart backend:
   ```bash
   docker-compose restart backend
   ```

3. Clear browser cache and reload

---

### Issue 5: Backend Can't Connect to Database

**Symptoms**: Backend logs show "connection refused" to postgres

**Solution**:
1. Verify postgres is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Check if backend is on both networks:
   ```bash
   docker inspect samnghethaycu_backend | grep -A 10 Networks
   ```
   Should show BOTH `traefik-public` AND `samnghethaycu_network`

3. Verify DATABASE_URL in backend/.env:
   ```env
   DATABASE_URL=postgresql://medusa:medusa@postgres:5432/medusa_db
   ```
   (Use service name `postgres`, not `localhost`)

---

## 🔒 Security Notes

### 1. No Direct Port Exposure ✅

Unlike traditional setups, **no ports are exposed** to the host:
- Services only accessible via Traefik
- Postgres and Redis are completely internal
- Reduces attack surface significantly

### 2. Traefik Handles SSL ✅

- Automatic SSL certificate generation
- Auto-renewal every 60 days
- Modern TLS protocols (1.2, 1.3)
- Strong cipher suites

### 3. Production Secrets 🔐

**CRITICAL**: Change these in production:

```bash
# Generate new secrets
openssl rand -base64 32  # JWT_SECRET
openssl rand -base64 32  # COOKIE_SECRET

# Update backend/.env
nano backend/.env
```

Never commit `.env` files to git!

---

## 📊 Monitoring

### Check Service Status

```bash
# All containers
docker-compose ps

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f storefront

# Traefik logs (if you have access)
docker logs <traefik-container-id> -f
```

---

### Check SSL Certificate Status

```bash
# From Traefik dashboard (if enabled)
# Visit: https://traefik.yourdomain.com (if configured)

# Or check via OpenSSL
openssl s_client -connect samnghethaycu.com:443 -servername samnghethaycu.com < /dev/null 2>/dev/null | openssl x509 -noout -dates
```

---

### Check Network Connectivity

```bash
# Test internal connectivity (from backend to postgres)
docker-compose exec backend ping postgres

# Test internal connectivity (from backend to redis)
docker-compose exec backend ping redis

# Check which networks a container is on
docker inspect samnghethaycu_backend | grep -A 10 Networks
```

---

## 🔄 Updates & Maintenance

### Deploy Code Updates

```bash
cd ~/samnghethaycu.com
git pull
docker-compose up -d --build
docker-compose logs -f
```

---

### Update Environment Variables

```bash
# Edit .env file
nano backend/.env

# Restart to apply changes
docker-compose restart backend
```

---

### Database Backup

```bash
# Manual backup
docker exec samnghethaycu_postgres pg_dump -U medusa medusa_db | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
gunzip -c backup_20260118_120000.sql.gz | docker exec -i samnghethaycu_postgres psql -U medusa -d medusa_db
```

---

### View Logs

```bash
# Real-time logs (all services)
docker-compose logs -f

# Logs for specific service
docker-compose logs -f backend
docker-compose logs -f storefront

# Last 100 lines
docker-compose logs --tail=100 backend
```

---

## ✅ Deployment Complete!

After following this guide, you should have:

- ✅ Sam Nghe Thay Cu integrated with Traefik
- ✅ HTTPS working for all 3 domains
- ✅ Auto-SSL certificate generation
- ✅ Secure internal networking
- ✅ No port conflicts with existing services
- ✅ Production-ready configuration

**Next Steps:**
1. Login to Admin Panel: https://admin.samnghethaycu.com
2. Configure API keys in Settings
3. Add products and categories
4. Customize storefront design
5. Setup payment gateway
6. Configure shipping methods

---

## 📞 Support

**Common Issues:**
- Check this guide's Troubleshooting section first
- Check Docker logs: `docker-compose logs -f`
- Check Traefik logs: `docker logs <traefik-container-id>`
- Verify DNS: `dig +short yourdomain.com`

**Critical Issues:**
- If Traefik is down, contact VPS admin
- If network issues persist, check `traefik-public` network exists
- If SSL fails, verify DNS propagation (up to 24-48 hours)

---

**Last Updated**: 2026-01-18
**Version**: 2.0.0 (Traefik Integration)
**Status**: Production Ready ✅
