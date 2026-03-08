#!/bin/bash
# Work Order Tracking (WOT) - Ubuntu 20.04 Automated Deployment Script
# 
# Prerequisites:
# - Ubuntu 20.04.6 LTS server with sudo access
# - Fresh/clean server recommended
# - Run this script as a sudo user: sudo bash deploy-ubuntu.sh
#
# Usage:
#   sudo bash deploy-ubuntu.sh

set -e  # Exit on error

echo "========================================"
echo "WOT Deployment - Ubuntu 20.04 LTS"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration Variables (customize as needed)
APP_NAME="workorder-tracking"
APP_USER="workorder_app"
APP_GROUP="workorder_app"
APP_PATH="/var/www/workorder-tracking"
REPO_URL="https://github.com/lnwsathit/bst-wot.git"
DB_NAME="workorder_tracking"
DB_USER="workorder_user"
NODE_VERSION="20"

echo -e "${YELLOW}Configuration:${NC}"
echo "  App Name: $APP_NAME"
echo "  App User: $APP_USER"
echo "  App Path: $APP_PATH"
echo "  Repository: $REPO_URL"
echo "  Database: $DB_NAME"
echo "  Node.js Version: v$NODE_VERSION"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[i]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    print_error "This script must be run as root (use sudo)"
    exit 1
fi

echo -e "${YELLOW}Step 1: Update System${NC}"
apt update
apt upgrade -y
print_status "System updated"

echo ""
echo -e "${YELLOW}Step 2: Install Node.js v$NODE_VERSION${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt install -y nodejs
print_status "Node.js installed: $(node -v)"
print_status "npm installed: $(npm -v)"

echo ""
echo -e "${YELLOW}Step 3: Install MySQL Server${NC}"
apt install -y mysql-server
print_status "MySQL Server installed"

echo ""
echo -e "${YELLOW}Step 4: Create Application User${NC}"
if id "$APP_USER" &>/dev/null; then
    print_info "User $APP_USER already exists"
else
    useradd -m -s /bin/bash $APP_USER
    print_status "User $APP_USER created"
fi

echo ""
echo -e "${YELLOW}Step 5: Create Application Directory${NC}"
mkdir -p $APP_PATH
chown -R $APP_USER:$APP_GROUP $APP_PATH
print_status "Application directory created and configured"

echo ""
echo -e "${YELLOW}Step 6: Clone Repository${NC}"
if [ -d "$APP_PATH/.git" ]; then
    print_info "Repository already exists, pulling latest changes..."
    cd $APP_PATH
    sudo -u $APP_USER git pull origin main
else
    sudo -u $APP_USER git clone $REPO_URL $APP_PATH
    print_status "Repository cloned"
fi

echo ""
echo -e "${YELLOW}Step 7: Install Node Dependencies${NC}"
cd $APP_PATH
sudo -u $APP_USER npm install --production
print_status "Node dependencies installed"

echo ""
echo -e "${YELLOW}Step 8: Setup MySQL Database${NC}"
read -sp "Enter MySQL root password: " MYSQL_ROOT_PASSWORD
echo ""
read -sp "Enter password for $DB_USER: " DB_PASSWORD
echo ""

mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

mysql -u $DB_USER -p"$DB_PASSWORD" $DB_NAME < $APP_PATH/config/schema.sql
print_status "Database created and schema loaded"

echo ""
echo -e "${YELLOW}Step 9: Configure Environment Variables${NC}"
cp $APP_PATH/.env.example $APP_PATH/.env

# Generate SESSION_SECRET
SESSION_SECRET=$(openssl rand -hex 32)

# Update .env file
cat > $APP_PATH/.env << EOF
DB_HOST=localhost
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME
DB_PORT=3306
PORT=3000
SESSION_SECRET=$SESSION_SECRET
NODE_ENV=production
EOF

chown $APP_USER:$APP_GROUP $APP_PATH/.env
chmod 600 $APP_PATH/.env
print_status "Environment variables configured"

echo ""
echo -e "${YELLOW}Step 10: Install PM2${NC}"
npm install -g pm2
print_status "PM2 installed: $(pm2 -v)"

echo ""
echo -e "${YELLOW}Step 11: Start Application with PM2${NC}"
cd $APP_PATH
sudo -u $APP_USER pm2 start ecosystem.config.js --env production
sudo -u $APP_USER pm2 save

# Setup PM2 startup
pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
print_status "Application started with PM2"

echo ""
echo -e "${YELLOW}Step 12: Install Nginx${NC}"
apt install -y nginx
print_status "Nginx installed: $(nginx -v 2>&1)"

echo ""
echo -e "${YELLOW}Step 13: Configure Nginx${NC}"
cp $APP_PATH/nginx.conf /etc/nginx/sites-available/$APP_NAME
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME

# Test nginx configuration
if nginx -t 2>&1 | grep -q "successful"; then
    systemctl restart nginx
    print_status "Nginx configured and restarted"
else
    print_error "Nginx configuration test failed!"
    systemctl restart nginx
fi

echo ""
echo -e "${YELLOW}Step 14: Setup PM2 Log Directory${NC}"
mkdir -p /var/log/pm2
chown -R $APP_USER:$APP_GROUP /var/log/pm2
print_status "PM2 log directory created"

echo ""
echo -e "${YELLOW}Step 15: Configure Firewall${NC}"
if command -v ufw &> /dev/null; then
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp   # SSH
    ufw allow 80/tcp   # HTTP
    ufw allow 443/tcp  # HTTPS
    ufw --force enable
    print_status "Firewall configured"
else
    print_info "UFW not installed, skipping firewall setup"
fi

echo ""
echo "========================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "========================================"
echo ""
echo "Next Steps:"
echo "1. Setup SSL/TLS certificate:"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot certonly --nginx -d your-domain.com"
echo ""
echo "2. Access the application:"
echo "   - Public tracking: http://192.168.1.139"
echo "   - Admin login: http://192.168.1.139/login"
echo "   - Default credentials: admin / admin123"
echo ""
echo "3. Change default admin password immediately!"
echo ""
echo "Useful Commands:"
echo "  pm2 status              # Check application status"
echo "  pm2 logs                # View application logs"
echo "  pm2 restart all         # Restart application"
echo "  sudo systemctl status nginx   # Check nginx status"
echo "  sudo systemctl reload nginx   # Reload nginx config"
echo ""
echo "Deployment Details:"
echo "  App Path: $APP_PATH"
echo "  App User: $APP_USER"
echo "  Database: $DB_NAME"
echo "  Config File: $APP_PATH/.env"
echo ""
