# Sam Nghe Thay Cu - Quick Reference Guide

Quick commands for managing your production deployment.

---

## 🚀 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart backend
docker-compose restart storefront

# View logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f storefront

# Check service status
docker-compose ps

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker-compose exec backend npx medusa user -e admin@example.com
docker-compose exec backend npx medusa db:migrate
docker-compose exec postgres psql -U medusa -d medusa_db
```

---

## 🌐 Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload Nginx (apply config changes without downtime)
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/storefront_access.log
sudo tail -f /var/log/nginx/api_access.log
sudo tail -f /var/log/nginx/admin_access.log

# Edit site configuration
sudo nano /etc/nginx/sites-available/samnghethaycu
```

---

## 🔒 SSL/TLS Commands

```bash
# List all certificates
sudo certbot certificates

# Renew certificates manually
sudo certbot renew

# Test renewal (dry run)
sudo certbot renew --dry-run

# Revoke certificate (if needed)
sudo certbot revoke --cert-name samnghethaycu.com

# Check auto-renewal timer
sudo systemctl status certbot.timer

# View Certbot logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

---

## 🛡️ Firewall Commands

```bash
# Check firewall status
sudo ufw status verbose

# Allow a port
sudo ufw allow 8080/tcp

# Deny a port
sudo ufw deny 8080/tcp

# Delete a rule
sudo ufw delete allow 8080/tcp

# Disable firewall (CAUTION!)
sudo ufw disable

# Enable firewall
sudo ufw enable

# Reset firewall to defaults
sudo ufw reset
```

---

## 💾 Database Commands

```bash
# Backup database
/opt/backups/backup-db.sh

# List backups
ls -lh /opt/backups/samnghethaycu/

# Restore from backup
gunzip -c /opt/backups/samnghethaycu/medusa_db_20260118_020000.sql.gz | \
docker exec -i samnghethaycu_postgres psql -U medusa -d medusa_db

# Connect to database
docker exec -it samnghethaycu_postgres psql -U medusa -d medusa_db

# Run migrations
docker-compose exec backend npx medusa db:migrate

# Create admin user
docker-compose exec backend npx medusa user -e admin@example.com -p password
```

---

## 📊 Monitoring Commands

```bash
# Check system resources
htop

# Check disk usage
df -h

# Check Docker disk usage
docker system df

# Clean up Docker (remove unused images, containers, volumes)
docker system prune -a

# Check memory usage
free -h

# Check CPU load
uptime

# Check network connections
netstat -tuln | grep LISTEN

# Check process list
ps aux | grep node

# Check container resource usage
docker stats
```

---

## 📝 Log Management

```bash
# View Docker logs (last 100 lines)
docker-compose logs --tail=100 backend

# View Nginx logs
sudo tail -100 /var/log/nginx/error.log
sudo tail -100 /var/log/nginx/storefront_access.log

# View backup logs
tail -f /var/log/samnghethaycu-backup.log

# Clear Docker logs (CAUTION!)
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Check log file sizes
du -sh /var/log/nginx/*

# Test log rotation
sudo logrotate -f /etc/logrotate.d/samnghethaycu
```

---

## 🔧 Maintenance Commands

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
cd ~/samnghethaycu.com
git pull
docker-compose pull
docker-compose up -d --build

# Clean up old Docker images
docker image prune -a

# Check for security updates
sudo unattended-upgrades --dry-run

# Reboot server (schedule during low-traffic)
sudo reboot
```

---

## 🚨 Emergency Commands

### Backend is Down

```bash
# Check logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose up -d --build backend

# Check if port 9000 is in use
sudo lsof -i :9000
```

### Nginx is Down

```bash
# Check status
sudo systemctl status nginx

# Check configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check logs
sudo tail -50 /var/log/nginx/error.log
```

### SSL Certificate Expired

```bash
# Check expiry
sudo certbot certificates

# Renew immediately
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Database Connection Failed

```bash
# Check Postgres container
docker ps | grep postgres

# Restart Postgres
docker-compose restart postgres

# Check Postgres logs
docker logs samnghethaycu_postgres

# Test connection
docker exec samnghethaycu_postgres pg_isready -U medusa
```

### Disk Space Full

```bash
# Check disk usage
df -h

# Find large files
sudo du -h / | sort -rh | head -20

# Clean Docker
docker system prune -a --volumes

# Clean logs
sudo find /var/log -type f -name "*.log" -mtime +30 -delete

# Clean old backups
find /opt/backups/samnghethaycu -name "*.sql.gz" -mtime +7 -delete
```

---

## 🔍 Debugging Commands

```bash
# Test backend API
curl -I https://api.samnghethaycu.com/health

# Test storefront
curl -I https://samnghethaycu.com

# Test admin
curl -I https://admin.samnghethaycu.com

# Check DNS resolution
dig +short samnghethaycu.com
nslookup api.samnghethaycu.com

# Check SSL certificate
openssl s_client -connect samnghethaycu.com:443 -servername samnghethaycu.com

# Test Nginx proxy
curl -H "Host: samnghethaycu.com" http://localhost

# Check port availability
sudo netstat -tuln | grep :443
sudo netstat -tuln | grep :80

# Check which process is using a port
sudo lsof -i :9000
```

---

## 🎯 Common Tasks

### Deploy Code Update

```bash
cd ~/samnghethaycu.com
git pull
docker-compose up -d --build
docker-compose logs -f
```

### Update Environment Variables

```bash
# Edit .env file
nano ~/samnghethaycu.com/backend/.env

# Restart to apply changes
docker-compose restart backend
```

### Add New Admin User

```bash
docker-compose exec backend npx medusa user \
  -e newemail@example.com \
  -p newpassword
```

### Reset Admin Password

```bash
docker-compose exec backend npx medusa user \
  -e admin@example.com \
  -p newpassword \
  --invite
```

### Check Application Health

```bash
# Backend health
curl https://api.samnghethaycu.com/health

# Check all containers
docker-compose ps

# Check Nginx
sudo systemctl status nginx

# Check SSL
sudo certbot certificates
```

---

## 📞 Quick Diagnostics

Run this when something goes wrong:

```bash
#!/bin/bash
echo "=== Docker Containers ==="
docker-compose ps

echo -e "\n=== Nginx Status ==="
sudo systemctl status nginx --no-pager

echo -e "\n=== SSL Certificates ==="
sudo certbot certificates

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Memory Usage ==="
free -h

echo -e "\n=== Recent Nginx Errors ==="
sudo tail -20 /var/log/nginx/error.log

echo -e "\n=== Backend Logs (last 20 lines) ==="
docker-compose logs --tail=20 backend
```

Save this as `~/diagnostics.sh`, make it executable: `chmod +x ~/diagnostics.sh`

---

**Last Updated**: 2026-01-18
**Version**: 1.0.0
