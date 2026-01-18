#!/bin/bash

# Sam Nghe Thay Cu - SSL Setup Script
# This script installs Let's Encrypt SSL certificates for all domains
# VPS IP: 69.62.82.145

set -e  # Exit on error

echo "================================================"
echo "Sam Nghe Thay Cu - SSL Certificate Setup"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}ERROR: Please run as root (use sudo)${NC}"
    exit 1
fi

# Step 1: Install Certbot
echo -e "${YELLOW}Step 1: Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    apt update
    apt install certbot python3-certbot-nginx -y
    echo -e "${GREEN}✓ Certbot installed successfully${NC}"
else
    echo -e "${GREEN}✓ Certbot already installed${NC}"
fi
echo ""

# Step 2: Verify Nginx configuration
echo -e "${YELLOW}Step 2: Testing Nginx configuration...${NC}"
nginx -t
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Nginx configuration is valid${NC}"
else
    echo -e "${RED}✗ Nginx configuration has errors. Please fix before proceeding.${NC}"
    exit 1
fi
echo ""

# Step 3: Reload Nginx
echo -e "${YELLOW}Step 3: Reloading Nginx...${NC}"
systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo ""

# Step 4: Verify DNS records
echo -e "${YELLOW}Step 4: Verifying DNS records...${NC}"
echo "Checking DNS for all domains..."

check_dns() {
    domain=$1
    expected_ip="69.62.82.145"
    actual_ip=$(dig +short $domain | tail -n1)

    if [ "$actual_ip" == "$expected_ip" ]; then
        echo -e "  ${GREEN}✓ $domain → $actual_ip${NC}"
        return 0
    else
        echo -e "  ${RED}✗ $domain → $actual_ip (expected: $expected_ip)${NC}"
        return 1
    fi
}

dns_ok=true
check_dns "samnghethaycu.com" || dns_ok=false
check_dns "www.samnghethaycu.com" || dns_ok=false
check_dns "api.samnghethaycu.com" || dns_ok=false
check_dns "admin.samnghethaycu.com" || dns_ok=false

if [ "$dns_ok" = false ]; then
    echo ""
    echo -e "${RED}WARNING: Some DNS records are not pointing to the correct IP!${NC}"
    echo "Please wait for DNS propagation (up to 24-48 hours) or fix DNS records."
    echo ""
    read -p "Do you want to continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborting."
        exit 1
    fi
fi
echo ""

# Step 5: Obtain SSL certificates
echo -e "${YELLOW}Step 5: Obtaining SSL certificates from Let's Encrypt...${NC}"
echo "This will obtain certificates for all domains."
echo ""

# Email for Let's Encrypt notifications
read -p "Enter your email for SSL certificate notifications: " email

if [ -z "$email" ]; then
    echo -e "${RED}ERROR: Email is required${NC}"
    exit 1
fi

echo ""
echo "Obtaining certificates..."
echo ""

# Certificate 1: Storefront (samnghethaycu.com + www)
echo -e "${YELLOW}Obtaining certificate for Storefront...${NC}"
certbot --nginx \
    -d samnghethaycu.com \
    -d www.samnghethaycu.com \
    --non-interactive \
    --agree-tos \
    --email "$email" \
    --redirect \
    --hsts \
    --staple-ocsp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Storefront SSL certificate obtained${NC}"
else
    echo -e "${RED}✗ Failed to obtain Storefront certificate${NC}"
    exit 1
fi
echo ""

# Certificate 2: Backend API
echo -e "${YELLOW}Obtaining certificate for Backend API...${NC}"
certbot --nginx \
    -d api.samnghethaycu.com \
    --non-interactive \
    --agree-tos \
    --email "$email" \
    --redirect \
    --hsts \
    --staple-ocsp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend API SSL certificate obtained${NC}"
else
    echo -e "${RED}✗ Failed to obtain Backend API certificate${NC}"
    exit 1
fi
echo ""

# Certificate 3: Admin Panel
echo -e "${YELLOW}Obtaining certificate for Admin Panel...${NC}"
certbot --nginx \
    -d admin.samnghethaycu.com \
    --non-interactive \
    --agree-tos \
    --email "$email" \
    --redirect \
    --hsts \
    --staple-ocsp

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Admin Panel SSL certificate obtained${NC}"
else
    echo -e "${RED}✗ Failed to obtain Admin Panel certificate${NC}"
    exit 1
fi
echo ""

# Step 6: Test automatic renewal
echo -e "${YELLOW}Step 6: Testing automatic renewal...${NC}"
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Automatic renewal test passed${NC}"
else
    echo -e "${RED}✗ Automatic renewal test failed${NC}"
fi
echo ""

# Step 7: Configure stronger SSL settings
echo -e "${YELLOW}Step 7: Configuring stronger SSL settings...${NC}"

cat > /etc/nginx/conf.d/ssl-params.conf << 'EOF'
# Sam Nghe Thay Cu - SSL Parameters
# Stronger SSL/TLS configuration for A+ rating

# SSL protocols (TLS 1.2 and 1.3 only)
ssl_protocols TLSv1.2 TLSv1.3;

# Strong cipher suites (modern configuration)
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';
ssl_prefer_server_ciphers off;

# SSL session caching
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# Security headers (will be added by Certbot, but we reinforce)
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
EOF

echo -e "${GREEN}✓ SSL parameters configured${NC}"
echo ""

# Step 8: Reload Nginx with SSL configuration
echo -e "${YELLOW}Step 8: Reloading Nginx with SSL configuration...${NC}"
nginx -t && systemctl reload nginx
echo -e "${GREEN}✓ Nginx reloaded with SSL${NC}"
echo ""

# Success summary
echo "================================================"
echo -e "${GREEN}✓ SSL SETUP COMPLETE!${NC}"
echo "================================================"
echo ""
echo "Your domains are now secured with SSL/TLS:"
echo "  • https://samnghethaycu.com"
echo "  • https://www.samnghethaycu.com"
echo "  • https://api.samnghethaycu.com"
echo "  • https://admin.samnghethaycu.com"
echo ""
echo "SSL certificates will auto-renew via certbot timer."
echo "Check renewal status: systemctl status certbot.timer"
echo ""
echo "Test your SSL configuration:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=samnghethaycu.com"
echo ""
echo "Next steps:"
echo "  1. Update backend/.env with HTTPS URLs"
echo "  2. Update storefront/.env with HTTPS URLs"
echo "  3. Restart Docker containers: docker-compose restart"
echo ""
