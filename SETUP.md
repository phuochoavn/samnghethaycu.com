# Quick Setup Guide

This guide will help you get the Sam Nghe Thay Cu platform up and running in minutes.

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm

## Option 1: Docker Setup (Recommended)

### Step 1: Setup Environment Files

```bash
# Copy environment templates
cp backend/.env.template backend/.env
cp storefront/.env.template storefront/.env
```

### Step 2: Start All Services

```bash
# Build and start everything
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### Step 3: Initialize Database

Wait for all services to be healthy (check with `docker-compose ps`), then:

```bash
# Run database migrations
docker-compose exec backend npm run migration:run

# Create admin user
docker-compose exec backend npx medusa user -e admin@samnghethaycu.com -p supersecret
```

### Step 4: Access the Applications

- **Storefront**: http://localhost:3000
- **Backend API**: http://localhost:9000
- **Admin Panel**: http://localhost:7001

## Option 2: Local Development

### Step 1: Install Dependencies

```bash
# From project root
npm run setup
```

### Step 2: Start Infrastructure Services

You still need PostgreSQL and Redis. Use Docker for these:

```bash
# Create a docker-compose.dev.yml with only postgres and redis
docker-compose up postgres redis
```

### Step 3: Update Environment Variables

Edit `backend/.env` and `storefront/.env` to point to localhost services:

```env
# backend/.env
DATABASE_URL=postgresql://medusa:medusa@localhost:5432/medusa_db
REDIS_URL=redis://localhost:6379
```

### Step 4: Run Backend

```bash
cd backend
npm run migration:run
npm run dev
```

### Step 5: Run Storefront

```bash
cd storefront
npm run dev
```

## Verification

### Backend Health Check

```bash
curl http://localhost:9000/health
```

Should return: `{"status":"ok"}`

### Storefront

Open http://localhost:3000 in your browser. You should see the Sam Nghe Thay Cu landing page.

## Troubleshooting

### Port Conflicts

If you get port conflicts, you can modify the ports in `docker-compose.yml` or stop the conflicting services.

### Docker Build Fails

```bash
# Clean everything and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres
```

### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Ensure migrations are run
docker-compose exec backend npm run migration:run
```

## Next Steps

After setup, refer to the main [README.md](./README.md) for:
- Development workflow
- Project architecture
- Roadmap
- Adding features

## Getting Help

- Check [README.md](./README.md) for detailed documentation
- Review [docker-compose.yml](./docker-compose.yml) for service configuration
- Check logs: `docker-compose logs -f [service-name]`
