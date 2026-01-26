# samnghethaycu.com - E-Commerce Platform

> **🏢 MULTI-TENANT DEPLOYMENT**
> This project is configured for deployment in a **shared VPS environment** with existing Traefik infrastructure.
> **👉 For deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

## Architecture Overview

This is a headless commerce platform built with MedusaJS v2, deployed on a shared DigitalOcean VPS using Docker Compose with namespace isolation.

### Tech Stack

- **Backend:** MedusaJS v2 (Node.js 20)
- **Frontend:** Next.js 15 (Phase 2)
- **Database:** PostgreSQL 16
- **Cache:** Redis 7
- **Reverse Proxy:** Traefik v3 (with Let's Encrypt SSL)

### Domain Structure

- `api.samnghethaycu.com` - Medusa API
- `admin.samnghethaycu.com` - Medusa Admin Panel
- `samnghethaycu.com` - Next.js Storefront (Phase 2)

## Phase 1: Infrastructure Core & Backend

### Architecture Decisions

#### The "Golden Architecture" Rules

1. **Missing Index.html Fix**
   - Medusa v2 builds admin panel into `.medusa/server`
   - Dockerfile sets `WORKDIR /app/server` in final stage
   - Copies build artifacts: `COPY --from=builder /app/.medusa/server /app/server`

2. **No Volume Shadowing**
   - Production does NOT mount source code (`./:/app`)
   - Only uploads directory is mounted: `medusa_uploads:/app/server/uploads`
   - Prevents overwriting compiled artifacts

3. **Routing & Admin Path**
   - Admin path: `/app` (configured in `medusa-config.ts`)
   - Traefik middleware redirects `admin.samnghethaycu.com` → `admin.samnghethaycu.com/app`
   - Port 9000 serves both API and Admin

4. **Split Architecture**
   - Redis modules: Event Bus, Workflow Engine, Cache
   - Two services: `medusa-server` (API + Admin) and `medusa-worker` (background jobs)
   - Controlled via `MEDUSA_WORKER_MODE` environment variable

5. **Multi-Tenant Isolation**
   - All containers namespaced with `sam_` prefix
   - Integrates with existing Traefik instance via `traefik-public` network
   - No port conflicts (80/443) - uses shared reverse proxy

## Deployment Instructions

**📖 For complete deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md)**

### Quick Overview

1. DigitalOcean VPS (Ubuntu 22.04 LTS recommended)
2. Docker and Docker Compose installed
3. Domain DNS configured:
   - `api.samnghethaycu.com` → VPS IP
   - `admin.samnghethaycu.com` → VPS IP
   - `traefik.samnghethaycu.com` → VPS IP (optional, for dashboard)

### Initial Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd samnghethaycu.com
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` and set:**
   - `JWT_SECRET` (generate with `openssl rand -base64 32`)
   - `COOKIE_SECRET` (generate with `openssl rand -base64 32`)
   - `ACME_EMAIL` (your email for Let's Encrypt)
   - `TRAEFIK_DASHBOARD_AUTH` (generate with `htpasswd -nb admin yourpassword`)

4. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

5. **Check logs:**
   ```bash
   docker-compose logs -f medusa-server
   ```

6. **Create admin user:**
   ```bash
   docker-compose exec medusa-server node --eval "
   const { Medusa } = require('@medusajs/framework');
   (async () => {
     const medusa = await Medusa.load();
     await medusa.admin.createUser({
       email: 'admin@samnghethaycu.com',
       password: 'supersecret'
     });
   })();
   "
   ```

### Service Management

```bash
# View all services
docker-compose ps

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart [service-name]

# Stop all services
docker-compose down

# Stop and remove volumes (DANGER: deletes data)
docker-compose down -v
```

### Database Migrations

Migrations run automatically via the `predeploy` script in `package.json`.

To run manually:
```bash
docker-compose exec medusa-server npm run db:migrate
```

### Updating the Application

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   docker-compose up -d --build
   ```

## Directory Structure

```
samnghethaycu.com/
├── backend/               # MedusaJS v2 Backend
│   ├── src/              # Custom modules and workflows
│   ├── Dockerfile        # Multi-stage production build
│   ├── medusa-config.ts  # Medusa configuration
│   ├── package.json      # Dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration
├── docker-compose.yml    # Production orchestration
├── .env.example          # Environment template
└── README.md            # This file
```

## Monitoring & Debugging

### Health Checks

- API: `https://api.samnghethaycu.com/health`
- Admin: `https://admin.samnghethaycu.com/app`
- Traefik Dashboard: `https://traefik.samnghethaycu.com` (if configured)

### Common Issues

**Admin panel shows "Cannot GET /app/index.html":**
- This is fixed by the Golden Architecture Rule 1
- Ensure Dockerfile uses correct WORKDIR and COPY commands

**502 Bad Gateway:**
- Check if medusa-server is running: `docker-compose ps`
- Check logs: `docker-compose logs medusa-server`
- Verify health check: `docker-compose exec medusa-server curl localhost:9000/health`

**Database connection errors:**
- Ensure PostgreSQL is healthy: `docker-compose ps postgres`
- Check connection string in `.env`

**Redis connection errors:**
- Ensure Redis is healthy: `docker-compose ps redis`
- Check connection string in `.env`

## Security Notes

1. **Never commit `.env` file** - contains secrets
2. **Change default passwords** in production
3. **Use strong JWT and Cookie secrets**
4. **Keep Traefik dashboard protected** with BasicAuth
5. **Regular backups** of PostgreSQL data

## Next Steps (Phase 2)

- [ ] Deploy Next.js 15 storefront
- [ ] Configure storefront domain
- [ ] Set up CI/CD pipeline
- [ ] Implement monitoring and logging
- [ ] Configure backup automation

## License

Proprietary - All rights reserved
