# Sam Nghe Thay Cu - Deployment Files

This directory contains all production deployment configurations for Sam Nghe Thay Cu e-commerce platform.

**VPS IP**: 69.62.82.145
**Domain**: samnghethaycu.com
**Reverse Proxy**: Traefik (Existing Infrastructure)

---

## 📁 Directory Contents

```
deployment/
├── TRAEFIK-DEPLOYMENT.md      # Complete Traefik integration guide
└── README.md                  # This file
```

---

## 🚀 Quick Start

### Traefik Integration (Leverages Existing Infrastructure)

This project integrates with your **existing Traefik reverse proxy** instead of installing Nginx. This prevents port conflicts and leverages your existing SSL automation.

```bash
# 1. Navigate to project directory
cd ~/samnghethaycu.com

# 2. Update environment variables (see TRAEFIK-DEPLOYMENT.md)
nano backend/.env
nano storefront/.env

# 3. Deploy with Docker Compose
docker-compose up -d

# 4. Verify deployment
curl -I https://samnghethaycu.com
curl -I https://api.samnghethaycu.com
curl -I https://admin.samnghethaycu.com
```

---

## 📚 Documentation

### [TRAEFIK-DEPLOYMENT.md](./TRAEFIK-DEPLOYMENT.md)
Complete guide for Traefik integration including:
- Architecture overview
- How Traefik auto-discovery works
- Environment configuration
- Step-by-step deployment
- Verification procedures
- Troubleshooting common issues
- Security best practices
- Monitoring & maintenance

**Read this first** if you're deploying for the first time.

---

## 🔧 Architecture Overview

### Traefik Integration

This project uses **Docker labels** to integrate with your existing Traefik reverse proxy:

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.*.rule=Host(`domain.com`)"
  - "traefik.http.routers.*.entrypoints=websecure"
  - "traefik.http.routers.*.tls.certresolver=le"
```

**Benefits:**
- ✅ No port conflicts with existing services
- ✅ Automatic SSL certificate generation
- ✅ HTTP → HTTPS redirect handled by Traefik
- ✅ Consistent with other VPS services
- ✅ No additional Nginx/Certbot installation needed

---

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] VPS is running Ubuntu/Debian
- [ ] Docker and Docker Compose are installed
- [ ] **Traefik is running** on the VPS
- [ ] **`traefik-public` network exists** (`docker network ls`)
- [ ] DNS A records point to VPS IP (69.62.82.145):
  - [ ] samnghethaycu.com
  - [ ] www.samnghethaycu.com
  - [ ] api.samnghethaycu.com
  - [ ] admin.samnghethaycu.com
- [ ] You have generated secure JWT and Cookie secrets

---

## 🎯 Deployment Steps

### Step 1: Environment Configuration (10 minutes)
- Generate secure secrets (JWT, Cookie)
- Update `backend/.env` with HTTPS URLs
- Update `storefront/.env` with HTTPS backend URL
- Set production CORS policies

### Step 2: Deploy Containers (5 minutes)
- Run `docker-compose up -d`
- Verify all containers are running
- Check Traefik discovered services

### Step 3: Database Initialization (5 minutes)
- Run migrations: `npx medusa db:migrate`
- Create admin user
- Test admin login

### Step 4: Verification (10 minutes)
- Test HTTPS access to all domains
- Verify SSL certificates auto-generated
- Test storefront → backend communication
- Check for CORS errors

**Total Time**: ~30 minutes (much faster than Nginx setup!)

---

## 📞 Support

If you encounter issues:

1. **Check logs**:
   ```bash
   docker-compose logs -f
   docker logs <traefik-container-id>
   ```

2. **Verify DNS**:
   ```bash
   dig +short samnghethaycu.com
   ```

3. **Check Traefik**:
   ```bash
   docker ps | grep traefik
   docker logs <traefik-container-id> --tail 50
   ```

4. **Verify network**:
   ```bash
   docker network ls | grep traefik
   ```

---

## 🔄 Updates

To update deployment:

```bash
cd ~/samnghethaycu.com
git pull

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

**No Traefik config changes needed** - labels are in `docker-compose.yml`

---

## 🔐 Security Notes

1. **SSL Certificates**: Auto-generated and renewed by Traefik
2. **No Port Exposure**: Services only accessible via Traefik
3. **Internal Network**: Postgres/Redis not exposed externally
4. **Secrets**: Must be changed from defaults in .env files
5. **CORS**: Restricted to production domains only

---

## 📊 Monitoring

Key monitoring points:

- **Container Health**: `docker-compose ps`
- **Traefik Status**: `docker ps | grep traefik`
- **SSL Certificates**: Check via browser (should auto-renew)
- **Disk Space**: `df -h`
- **Logs**: `docker-compose logs -f`

---

## 🚨 Troubleshooting

**Common Issues:**
- Network not found → Create `traefik-public` network
- 404 errors → Check Traefik logs for service discovery
- SSL errors → Wait 1-2 minutes for certificate generation
- CORS errors → Check backend/.env CORS settings

**Full troubleshooting guide**: [TRAEFIK-DEPLOYMENT.md](./TRAEFIK-DEPLOYMENT.md)

---

**Last Updated**: 2026-01-18
**Version**: 2.0.0 (Traefik Integration)
**Status**: Production Ready ✅
