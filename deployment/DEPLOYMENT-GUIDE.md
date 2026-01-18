# Sam Nghe Thay Cu - Production Deployment Guide

**VPS IP**: 69.62.82.145
**Domains**: samnghethaycu.com, api.samnghethaycu.com, admin.samnghethaycu.com
**Date**: 2026-01-18
**Phase**: Phase 2 - Nginx + SSL + Production Hardening

---

## 📋 Prerequisites Checklist

Before starting, ensure:

- [x] VPS is running Ubuntu/Debian
- [x] Docker and Docker Compose are installed
- [x] All DNS A records are pointing to `69.62.82.145`:
  - `samnghethaycu.com` → 69.62.82.145
  - `www.samnghethaycu.com` → 69.62.82.145
  - `api.samnghethaycu.com` → 69.62.82.145
  - `admin.samnghethaycu.com` → 69.62.82.145
- [x] Docker containers are running (backend, storefront, postgres, redis)
- [x] Firewall allows ports 22, 80, 443

---

## 🚀 Stage 1: Nginx Installation & Configuration

### Step 1.1: Install Nginx

```bash
# Update package list
sudo apt update

# Install Nginx
sudo apt install nginx -y

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Start Nginx
sudo systemctl start nginx

# Verify Nginx is running
sudo systemctl status nginx
```

**Expected output**: `active (running)`

---

### Step 1.2: Deploy Nginx Configuration

```bash
# Copy the configuration file from the project
sudo cp ~/samnghethaycu.com/deployment/nginx/samnghethaycu /etc/nginx/sites-available/samnghethaycu

# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/samnghethaycu /etc/nginx/sites-enabled/samnghethaycu

# Remove default Nginx site (if exists)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t
```

**Expected output**:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

### Step 1.3: Reload Nginx

```bash
# Reload Nginx to apply new configuration
sudo systemctl reload nginx

# Check Nginx status
sudo systemctl status nginx
```

---

### Step 1.4: Test HTTP Access

```bash
# Test storefront (should return HTML)
curl -I http://samnghethaycu.com

# Test API (should return JSON or health check)
curl http://api.samnghethaycu.com/health

# Test admin (should return HTML)
curl -I http://admin.samnghethaycu.com
```

**Expected**: HTTP 200 responses

If you get errors:
- Check Docker containers: `docker ps`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Check backend logs: `docker logs samnghethaycu_backend`

---

## 🔒 Stage 2: SSL/TLS Setup with Let's Encrypt

### Step 2.1: Verify DNS Propagation

Before obtaining SSL certificates, verify DNS is fully propagated:

```bash
# Check DNS for all domains
dig +short samnghethaycu.com
dig +short www.samnghethaycu.com
dig +short api.samnghethaycu.com
dig +short admin.samnghethaycu.com
```

**All should return**: `69.62.82.145`

If not, wait for DNS propagation (can take up to 24-48 hours).

---

### Step 2.2: Run SSL Setup Script

```bash
# Make the script executable
chmod +x ~/samnghethaycu.com/deployment/nginx/setup-ssl.sh

# Run the script as root
sudo ~/samnghethaycu.com/deployment/nginx/setup-ssl.sh
```

**What this script does:**
1. Installs Certbot
2. Verifies Nginx configuration
3. Checks DNS records
4. Obtains SSL certificates for all 3 domains
5. Configures HTTP → HTTPS redirect
6. Enables HSTS and OCSP stapling
7. Tests automatic renewal
8. Configures stronger SSL parameters

**Interactive prompt**: You'll be asked for your email address for SSL notifications.

---

### Step 2.3: Verify SSL Installation

After the script completes:

```bash
# Test HTTPS access
curl -I https://samnghethaycu.com
curl -I https://api.samnghethaycu.com
curl -I https://admin.samnghethaycu.com

# Check certificate expiry
sudo certbot certificates
```

**Expected output**: All certificates should be valid for 90 days.

---

### Step 2.4: Test SSL Rating

Visit: https://www.ssllabs.com/ssltest/analyze.html?d=samnghethaycu.com

**Expected rating**: A or A+

---

## 🛡️ Stage 3: Environment Hardening

### Step 3.1: Generate Secure Secrets

```bash
# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)"

# Generate Cookie secret
echo "COOKIE_SECRET=$(openssl rand -base64 32)"
```

Copy these values - you'll need them in the next step.

---

### Step 3.2: Update Backend Environment

```bash
# Edit backend .env file
nano ~/samnghethaycu.com/backend/.env
```

**Update the following values:**

```env
# Environment
NODE_ENV=production

# Database (keep as is, internal to Docker)
DATABASE_URL=postgresql://medusa:medusa@postgres:5432/medusa_db

# Redis (keep as is, internal to Docker)
REDIS_URL=redis://redis:6379

# Backend URL (UPDATE TO HTTPS)
MEDUSA_BACKEND_URL=https://api.samnghethaycu.com

# CORS - Production Domains Only (UPDATE TO HTTPS)
STORE_CORS=https://samnghethaycu.com,https://www.samnghethaycu.com
ADMIN_CORS=https://admin.samnghethaycu.com
AUTH_CORS=https://samnghethaycu.com,https://admin.samnghethaycu.com

# Secrets (CHANGE THESE TO YOUR GENERATED VALUES!)
JWT_SECRET=<your-generated-jwt-secret>
COOKIE_SECRET=<your-generated-cookie-secret>

# Worker Mode
MEDUSA_WORKER_MODE=shared
```

**Save and exit**: `Ctrl + X`, then `Y`, then `Enter`

---

### Step 3.3: Update Storefront Environment

```bash
# Edit storefront .env file
nano ~/samnghethaycu.com/storefront/.env
```

**Update the following values:**

```env
# Environment
NODE_ENV=production

# Backend API URL (UPDATE TO HTTPS)
NEXT_PUBLIC_MEDUSA_BACKEND_URL=https://api.samnghethaycu.com

# Publishable Key (get from Medusa Admin after login)
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<get-from-admin-panel>
```

**Save and exit**: `Ctrl + X`, then `Y`, then `Enter`

---

### Step 3.4: Restart Docker Containers

```bash
# Restart all containers to apply new environment variables
cd ~/samnghethaycu.com
docker-compose restart

# Check if all containers are running
docker-compose ps

# Check logs for any errors
docker-compose logs -f backend
# Press Ctrl+C to exit logs
```

---

### Step 3.5: Configure Firewall (UFW)

```bash
# Enable UFW if not already enabled
sudo ufw status

# If inactive, configure it:
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (CRITICAL - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Verify status
sudo ufw status verbose
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## ✅ Stage 4: Verification & Testing

### Step 4.1: Test All Services

```bash
# Test Storefront
curl -I https://samnghethaycu.com
# Expected: HTTP/2 200

# Test Backend API
curl https://api.samnghethaycu.com/health
# Expected: {"status":"ok"} or similar

# Test Admin Panel
curl -I https://admin.samnghethaycu.com
# Expected: HTTP/2 200

# Test HTTP → HTTPS redirect
curl -I http://samnghethaycu.com
# Expected: HTTP/1.1 301 Moved Permanently
# Location: https://samnghethaycu.com/
```

---

### Step 4.2: Test in Browser

Open a web browser and visit:

1. **Storefront**: https://samnghethaycu.com
   - Should load Next.js storefront
   - Check for SSL padlock in address bar

2. **Backend API**: https://api.samnghethaycu.com/health
   - Should return health check response

3. **Admin Panel**: https://admin.samnghethaycu.com
   - Should load Medusa Admin UI
   - Login with your admin credentials

---

### Step 4.3: Check SSL Security

Visit: https://www.ssllabs.com/ssltest/analyze.html?d=samnghethaycu.com

**Expected rating**: A or A+

Key features:
- ✅ TLS 1.3 support
- ✅ Strong cipher suites
- ✅ HSTS enabled
- ✅ OCSP stapling
- ✅ Perfect Forward Secrecy

---

### Step 4.4: Check Nginx Logs

```bash
# Check for any errors
sudo tail -f /var/log/nginx/error.log

# Check access logs
sudo tail -f /var/log/nginx/storefront_access.log
sudo tail -f /var/log/nginx/api_access.log
sudo tail -f /var/log/nginx/admin_access.log
```

---

## 🔧 Stage 5: Production Optimization

### Step 5.1: Configure Log Rotation

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/samnghethaycu
```

**Add the following:**

```
/var/log/nginx/*_access.log
/var/log/nginx/*_error.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

**Save and exit**: `Ctrl + X`, then `Y`, then `Enter`

---

### Step 5.2: Test Log Rotation

```bash
# Test logrotate configuration
sudo logrotate -d /etc/logrotate.d/samnghethaycu

# Force rotation (optional, for testing)
sudo logrotate -f /etc/logrotate.d/samnghethaycu
```

---

### Step 5.3: Monitor System Resources

```bash
# Check CPU and memory usage
htop

# Check disk usage
df -h

# Check Docker container resource usage
docker stats
```

---

## 📦 Stage 6: Database Backup Setup

### Step 6.1: Create Backup Directory

```bash
# Create backup directory
sudo mkdir -p /opt/backups/samnghethaycu

# Set permissions
sudo chown $USER:$USER /opt/backups/samnghethaycu
```

---

### Step 6.2: Create Backup Script

```bash
# Create backup script
nano /opt/backups/backup-db.sh
```

**Add the following:**

```bash
#!/bin/bash
# Sam Nghe Thay Cu - Database Backup Script

BACKUP_DIR="/opt/backups/samnghethaycu"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/medusa_db_$DATE.sql.gz"

# Create backup
docker exec samnghethaycu_postgres pg_dump -U medusa medusa_db | gzip > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup successful: $BACKUP_FILE"

    # Keep only last 7 days of backups
    find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

    # Log backup
    echo "$(date): Backup created - $BACKUP_FILE" >> /var/log/samnghethaycu-backup.log
else
    echo "Backup failed!"
    exit 1
fi
```

**Save and exit**, then make it executable:

```bash
chmod +x /opt/backups/backup-db.sh
```

---

### Step 6.3: Test Backup Script

```bash
# Run backup manually
/opt/backups/backup-db.sh

# Check if backup was created
ls -lh /opt/backups/samnghethaycu/
```

---

### Step 6.4: Schedule Daily Backups

```bash
# Edit crontab
crontab -e
```

**Add the following line (daily backup at 2 AM):**

```
0 2 * * * /opt/backups/backup-db.sh
```

**Save and exit**.

Verify cron job:

```bash
crontab -l
```

---

## 🎯 Post-Deployment Checklist

### Security

- [x] SSL/TLS enabled for all domains
- [x] HTTP → HTTPS redirect active
- [x] HSTS enabled
- [x] Strong secrets generated (JWT, Cookie)
- [x] CORS restricted to production domains
- [x] Firewall configured (UFW)
- [x] Rate limiting active

### Functionality

- [x] Storefront loads over HTTPS
- [x] Backend API responds over HTTPS
- [x] Admin Panel accessible over HTTPS
- [x] Database migrations applied
- [x] Admin user created

### Monitoring & Backup

- [x] Nginx logs configured
- [x] Log rotation enabled
- [x] Database backup script created
- [x] Daily backup cron job scheduled
- [x] SSL auto-renewal configured

---

## 📊 Monitoring Commands

```bash
# Check all services status
docker-compose ps

# Check Nginx status
sudo systemctl status nginx

# Check SSL certificate expiry
sudo certbot certificates

# Check firewall status
sudo ufw status

# Check disk usage
df -h

# Check Docker disk usage
docker system df

# View real-time logs
docker-compose logs -f

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🐛 Troubleshooting

### Issue: SSL Certificate Not Obtained

**Symptoms**: Certbot fails with "Failed authorization procedure"

**Solution**:
1. Verify DNS: `dig +short yourdomain.com` should return VPS IP
2. Check Nginx is running: `sudo systemctl status nginx`
3. Check port 80 is open: `sudo ufw status`
4. Wait for DNS propagation (up to 48 hours)

---

### Issue: Admin Panel Not Loading

**Symptoms**: 502 Bad Gateway or timeout

**Solution**:
1. Check backend container: `docker logs samnghethaycu_backend`
2. Verify backend is listening on port 7001: `docker ps`
3. Check Nginx proxy: `sudo nginx -t`
4. Restart backend: `docker-compose restart backend`

---

### Issue: CORS Errors in Browser Console

**Symptoms**: "CORS policy" errors in browser console

**Solution**:
1. Verify `STORE_CORS` and `ADMIN_CORS` in `backend/.env` include HTTPS URLs
2. Restart backend: `docker-compose restart backend`
3. Clear browser cache

---

### Issue: File Upload Fails

**Symptoms**: Large file uploads timeout or fail

**Solution**:
1. Check `client_max_body_size` in Nginx config (should be 50M)
2. Check backend logs for errors
3. Verify disk space: `df -h`

---

## 📞 Support

If you encounter issues not covered in this guide:

1. Check logs: `docker-compose logs -f`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify DNS: `dig +short yourdomain.com`
4. Check SSL: `sudo certbot certificates`

---

## ✅ Deployment Complete!

Your Sam Nghe Thay Cu e-commerce platform is now live in production with:

- ✅ HTTPS/SSL encryption (A+ rating)
- ✅ Nginx reverse proxy with rate limiting
- ✅ Production environment variables
- ✅ Firewall configured
- ✅ Automated backups
- ✅ SSL auto-renewal

**URLs:**
- Storefront: https://samnghethaycu.com
- Backend API: https://api.samnghethaycu.com
- Admin Panel: https://admin.samnghethaycu.com

**Next Steps:**
- Configure payment gateway in Medusa Admin
- Add products and categories
- Customize storefront design
- Setup email notifications
- Configure shipping methods

---

**Last Updated**: 2026-01-18
**Version**: 1.0.0 (Production Deployment)
