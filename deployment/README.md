# Sam Nghe Thay Cu - Deployment Files

This directory contains all production deployment configurations and scripts for Sam Nghe Thay Cu e-commerce platform.

**VPS IP**: 69.62.82.145
**Domain**: samnghethaycu.com

---

## 📁 Directory Contents

```
deployment/
├── nginx/
│   ├── samnghethaycu          # Nginx site configuration
│   └── setup-ssl.sh           # SSL certificate setup script
├── DEPLOYMENT-GUIDE.md        # Complete step-by-step deployment guide
├── QUICK-REFERENCE.md         # Quick command reference
└── README.md                  # This file
```

---

## 🚀 Quick Start

### For Initial Deployment (Stage 1 & 2):

```bash
# 1. Install Nginx
sudo apt update && sudo apt install nginx -y

# 2. Deploy Nginx configuration
sudo cp ~/samnghethaycu.com/deployment/nginx/samnghethaycu /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/samnghethaycu /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 3. Setup SSL
chmod +x ~/samnghethaycu.com/deployment/nginx/setup-ssl.sh
sudo ~/samnghethaycu.com/deployment/nginx/setup-ssl.sh
```

---

## 📚 Documentation

### [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)
Complete step-by-step guide for production deployment including:
- Nginx installation & configuration
- SSL/TLS setup with Let's Encrypt
- Environment hardening
- Firewall configuration
- Database backup setup
- Monitoring & logging
- Troubleshooting

**Read this first** if you're deploying for the first time.

---

### [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
Quick command reference for:
- Docker commands
- Nginx management
- SSL/TLS management
- Database operations
- Monitoring & debugging
- Emergency procedures

**Bookmark this** for daily operations.

---

## 🔧 Configuration Files

### `nginx/samnghethaycu`
Nginx site configuration with:
- Reverse proxy for 3 domains (storefront, API, admin)
- Rate limiting
- WebSocket support for Admin Panel
- Gzip compression
- Security headers
- 50M max upload size
- Optimized timeouts and buffering

**Deployment path**: `/etc/nginx/sites-available/samnghethaycu`

---

### `nginx/setup-ssl.sh`
Automated SSL setup script that:
- Installs Certbot
- Verifies DNS records
- Obtains SSL certificates for all domains
- Configures HTTP → HTTPS redirect
- Enables HSTS and OCSP stapling
- Tests automatic renewal
- Configures strong SSL parameters (A+ rating)

**Usage**: `sudo ./setup-ssl.sh`

---

## ✅ Deployment Checklist

Before running deployment scripts, ensure:

- [ ] VPS is running Ubuntu/Debian
- [ ] Docker and Docker Compose are installed
- [ ] DNS A records point to VPS IP (69.62.82.145):
  - [ ] samnghethaycu.com
  - [ ] www.samnghethaycu.com
  - [ ] api.samnghethaycu.com
  - [ ] admin.samnghethaycu.com
- [ ] Docker containers are running (backend, storefront, postgres, redis)
- [ ] Firewall allows ports 22, 80, 443
- [ ] You have an email address for SSL notifications

---

## 🎯 Deployment Stages

### Stage 1: Nginx Setup (20 minutes)
- Install Nginx
- Deploy configuration
- Test HTTP access

### Stage 2: SSL/TLS (30 minutes)
- Verify DNS propagation
- Run SSL setup script
- Test HTTPS access

### Stage 3: Environment Hardening (30 minutes)
- Generate secure secrets
- Update .env files
- Configure firewall
- Restart containers

### Stage 4: Backup & Monitoring (30 minutes)
- Setup database backups
- Configure log rotation
- Test backup script
- Schedule cron jobs

**Total Time**: ~2 hours

---

## 📞 Support

If you encounter issues:

1. **Check logs**:
   ```bash
   docker-compose logs -f
   sudo tail -f /var/log/nginx/error.log
   ```

2. **Verify DNS**:
   ```bash
   dig +short samnghethaycu.com
   ```

3. **Check SSL**:
   ```bash
   sudo certbot certificates
   ```

4. **Run diagnostics** (see QUICK-REFERENCE.md)

---

## 🔄 Updates

To update deployment files:

```bash
cd ~/samnghethaycu.com
git pull

# If Nginx config changed:
sudo cp deployment/nginx/samnghethaycu /etc/nginx/sites-available/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 Security Notes

1. **SSL Certificates**: Auto-renew every 90 days via Certbot timer
2. **Firewall**: Only ports 22, 80, 443 are open
3. **Rate Limiting**: Enabled for all services
4. **Secrets**: Must be changed from defaults in .env files
5. **CORS**: Restricted to production domains only

---

## 📊 Monitoring

Key monitoring points:

- **SSL Expiry**: `sudo certbot certificates`
- **Disk Space**: `df -h`
- **Container Health**: `docker-compose ps`
- **Nginx Status**: `sudo systemctl status nginx`
- **Logs**: `/var/log/nginx/` and `docker-compose logs`

---

## 🚨 Emergency Contacts

**SSL Issues**: Check [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md) → Troubleshooting
**Docker Issues**: Check [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) → Emergency Commands
**Nginx Issues**: Check logs at `/var/log/nginx/error.log`

---

**Last Updated**: 2026-01-18
**Version**: 1.0.0
**Status**: Production Ready ✅
