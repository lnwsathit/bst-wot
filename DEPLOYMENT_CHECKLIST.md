# Deployment Alignment Checklist

**Target Server:** 192.168.1.139 (Ubuntu 20.04.6 LTS)  
**Date:** March 8, 2026  
**Repository:** https://github.com/lnwsathit/bst-wot

## Overview

This checklist ensures your local development environment and production server are properly aligned and configured for deployment.

---

## ✅ Local Development Environment (Current Workstation)

### Database Configuration

- [x] **.env file exists** with correct database credentials
- [x] **DB_PASSWORD updated** to `<your_db_password>`
- [x] **DB_USER** set to `root` (acceptable for local development)
- [x] **DB_NAME** set to `workorder_tracking`
- [ ] **MySQL root password updated** to match .env
  ```bash
  # Run this command to update MySQL root password:
  sudo mysql -u root
  ALTER USER 'root'@'localhost' IDENTIFIED BY '<your_db_password>';
  FLUSH PRIVILEGES;
  EXIT;
  
  # Test the connection:
  mysql -u root -p'<your_db_password>' -e "SELECT 'Connection successful!' AS status;"
  ```

### Application Configuration

- [x] **NODE_ENV** set to `development` in .env
- [ ] **SESSION_SECRET** needs to be updated (currently using placeholder)
  ```bash
  # Generate a secure SESSION_SECRET for development:
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  # Copy the output and update SESSION_SECRET in .env
  ```
- [x] **PORT** set to `3000`
- [x] **Server IP** configured in ecosystem.config.js (192.168.1.139)

### Code Repository

- [x] **All deployment files updated** for Ubuntu 20.04
  - [x] nginx.conf (server_name: 192.168.1.139)
  - [x] NGINX_SETUP.md (Ubuntu instructions)
  - [x] SERVER_REQUIREMENTS.txt (Node.js 20.x)
  - [x] ecosystem.config.js (production settings)
- [x] **Changes committed** to git (commit: 2b4fab2)
- [x] **Changes pushed** to GitHub
- [x] **No sensitive data** in repository (.env in .gitignore)

### Local Testing

- [ ] **Dependencies installed**: `npm install`
- [ ] **Database connection verified**: `node scripts/test-db-connection.js` (if exists)
- [ ] **Application starts successfully**: `npm start`
- [ ] **Login works** at http://localhost:3000
- [ ] **Database queries execute** without errors

---

## 🚀 Production Server (192.168.1.139)

### System Requirements

- [ ] **Ubuntu 20.04.6 LTS** installed and updated
  ```bash
  ssh user@192.168.1.139
  lsb_release -a    # Verify Ubuntu version
  sudo apt update && sudo apt upgrade -y
  ```

- [ ] **Node.js v20.20.1+** installed
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  node --version    # Should show v20.20.1 or higher
  npm --version     # Should show 10.8.2 or higher
  ```

- [ ] **MySQL 8.0.42+** installed and running
  ```bash
  sudo apt install -y mysql-server
  mysql --version   # Should show 8.0.42 or higher
  sudo systemctl status mysql
  ```

- [ ] **Nginx 1.18.0+** installed
  ```bash
  sudo apt install -y nginx
  nginx -v          # Should show 1.18.0 or higher
  ```

- [ ] **PM2 6.0.14+** installed globally
  ```bash
  sudo npm install -g pm2
  pm2 --version     # Should show 6.0.14 or higher
  ```

### Database Setup

- [ ] **MySQL root password set** to `<your_db_password>`
  ```bash
  # If MySQL was just installed with socket auth:
  sudo mysql
  ALTER USER 'root'@'localhost' IDENTIFIED BY '<your_db_password>';
  FLUSH PRIVILEGES;
  EXIT;
  
  # Test connection:
  mysql -u root -p'<your_db_password>' -e "SELECT 'Connected!' AS status;"
  ```

- [ ] **Application database user created** (recommended, not root)
  ```sql
  -- Connect as root:
  mysql -u root -p'<your_db_password>'
  
  -- Create dedicated user:
  CREATE USER 'workorder_user'@'localhost' IDENTIFIED BY '<your_db_password>';
  GRANT ALL PRIVILEGES ON workorder_tracking.* TO 'workorder_user'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```

- [ ] **Database created**
  ```sql
  mysql -u root -p'<your_db_password>'
  CREATE DATABASE IF NOT EXISTS workorder_tracking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  EXIT;
  ```

- [ ] **Database schema imported**
  ```bash
  # If you have a schema.sql or dump file:
  mysql -u workorder_user -p'<your_db_password>' workorder_tracking < schema.sql
  
  # Or import from your local database:
  # On local machine:
  mysqldump -u root -p'<your_db_password>' workorder_tracking > wot_schema.sql
  scp wot_schema.sql user@192.168.1.139:~/
  
  # On server:
  mysql -u workorder_user -p'<your_db_password>' workorder_tracking < ~/wot_schema.sql
  ```

- [ ] **Database connection verified**
  ```bash
  mysql -u workorder_user -p'<your_db_password>' workorder_tracking -e "SHOW TABLES;"
  ```

### Application Deployment

- [ ] **Application directory created**
  ```bash
  sudo mkdir -p /var/www/workorder-tracking
  sudo chown -R $USER:$USER /var/www/workorder-tracking
  ```

- [ ] **Repository cloned**
  ```bash
  cd /var/www/workorder-tracking
  git clone https://github.com/lnwsathit/bst-wot.git .
  ```

- [ ] **Dependencies installed**
  ```bash
  npm install --production
  ```

- [ ] **.env file created** from template
  ```bash
  cp .env.example .env
  nano .env  # Configure with production settings (see below)
  ```

- [ ] **.env configured** with production values
  ```bash
  # /var/www/workorder-tracking/.env
  DB_HOST=localhost
  DB_USER=workorder_user        # Use dedicated user, not root!
  DB_PASSWORD=<your_db_password>
  DB_NAME=workorder_tracking
  DB_PORT=3306
  
  PORT=3000
  SERVER_IP=192.168.1.139
  
  # Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  SESSION_SECRET=<64-character-hex-string>
  
  NODE_ENV=production
  ```

- [ ] **File permissions set** correctly
  ```bash
  # Secure .env file
  chmod 600 /var/www/workorder-tracking/.env
  
  # Uploads directory writable
  chmod 755 /var/www/workorder-tracking/uploads
  
  # Static files readable
  chmod 755 /var/www/workorder-tracking/public
  ```

### PM2 Process Management

- [ ] **PM2 configured** with ecosystem file
  ```bash
  # The ecosystem.config.js is already in the repository
  pm2 start ecosystem.config.js
  ```

- [ ] **PM2 startup script configured**
  ```bash
  pm2 startup systemd
  # Follow the instructions output by PM2 (will show a command to run with sudo)
  
  pm2 save  # Save current process list
  ```

- [ ] **Application running** and healthy
  ```bash
  pm2 status
  pm2 logs workorder-tracking --lines 50
  curl http://127.0.0.1:3000  # Should return HTML
  ```

### Nginx Configuration

- [ ] **nginx.conf copied** to Nginx directory
  ```bash
  sudo cp /var/www/workorder-tracking/nginx.conf /etc/nginx/sites-available/workorder-tracking
  
  # Enable site
  sudo ln -s /etc/nginx/sites-available/workorder-tracking /etc/nginx/sites-enabled/
  
  # Remove default site
  sudo rm /etc/nginx/sites-enabled/default
  ```

- [ ] **Nginx configuration tested**
  ```bash
  sudo nginx -t
  # Should show: "syntax is ok" and "test is successful"
  ```

- [ ] **Nginx restarted**
  ```bash
  sudo systemctl restart nginx
  sudo systemctl status nginx
  ```

- [ ] **Application accessible** via Nginx
  ```bash
  curl http://192.168.1.139/
  curl http://localhost/
  ```

### Firewall Configuration

- [ ] **UFW firewall** configured
  ```bash
  sudo ufw allow 22/tcp    # SSH
  sudo ufw allow 80/tcp    # HTTP
  sudo ufw allow 443/tcp   # HTTPS (for future SSL)
  sudo ufw enable
  sudo ufw status
  ```

### Verification Tests

- [ ] **All services running**
  ```bash
  # Check all services
  sudo systemctl status mysql
  sudo systemctl status nginx
  pm2 status
  
  # Check ports
  sudo ss -tlnp | grep -E ':(80|3000|3306)'
  ```

- [ ] **Application accessible** from browser
  - Open http://192.168.1.139 in browser
  - Login page loads correctly
  - Static files (CSS, JS, images) load
  - Forms submit successfully

- [ ] **Database operations work**
  - Login with valid credentials
  - View work orders list
  - Create a new work order
  - Update work order status
  - Upload documents (if applicable)

- [ ] **Logs show no errors**
  ```bash
  # Application logs
  pm2 logs workorder-tracking --lines 100
  
  # Nginx logs
  sudo tail -f /var/log/nginx/access.log
  sudo tail -f /var/log/nginx/error.log
  
  # MySQL logs
  sudo tail -f /var/log/mysql/error.log
  ```

---

## 🔒 Security Hardening (Recommended)

### Production Best Practices

- [ ] **Root user disabled** for database (use workorder_user)
- [ ] **Strong SESSION_SECRET** generated (64+ character hex)
- [ ] **NODE_ENV=production** in server .env
- [ ] **Secure session cookies** (handled automatically when NODE_ENV=production)
- [ ] **File permissions** restricted (.env is 600)

### Optional Security Enhancements

- [ ] **SSL/TLS certificate** installed (Let's Encrypt)
  ```bash
  sudo apt install certbot python3-certbot-nginx
  sudo certbot --nginx -d yourdomain.com
  ```

- [ ] **Fail2Ban** installed for brute-force protection
  ```bash
  sudo apt install fail2ban
  sudo systemctl enable fail2ban
  sudo systemctl start fail2ban
  ```

- [ ] **Automatic security updates** enabled
  ```bash
  sudo apt install unattended-upgrades
  sudo dpkg-reconfigure -plow unattended-upgrades
  ```

- [ ] **Database backups** scheduled
  ```bash
  # Add to crontab (crontab -e):
  0 2 * * * /usr/bin/mysqldump -u workorder_user -p'<your_db_password>' workorder_tracking > /backups/wot-$(date +\%Y\%m\%d).sql
  
  # Create backup directory:
  sudo mkdir -p /backups
  sudo chown $USER:$USER /backups
  ```

- [ ] **Application backups** scheduled
  ```bash
  # Add to crontab:
  0 3 * * * rsync -az /var/www/workorder-tracking/ /backups/app-backup/
  ```

---

## 📋 Maintenance Commands

### Application Management

```bash
# View application status
pm2 status
pm2 logs workorder-tracking

# Restart application
pm2 restart workorder-tracking

# Stop application
pm2 stop workorder-tracking

# View resource usage
pm2 monit
```

### Update Application

```bash
cd /var/www/workorder-tracking
git pull origin main
npm install --production
pm2 restart workorder-tracking
```

### Nginx Management

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

### Database Management

```bash
# Backup database
mysqldump -u workorder_user -p'<your_db_password>' workorder_tracking > backup.sql

# Restore database
mysql -u workorder_user -p'<your_db_password>' workorder_tracking < backup.sql

# Check database size
mysql -u workorder_user -p'<your_db_password>' -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema='workorder_tracking';"
```

---

## 🆘 Troubleshooting

### Application won't start

1. Check PM2 logs: `pm2 logs workorder-tracking --err`
2. Verify .env file exists and has correct permissions
3. Test Node.js directly: `cd /var/www/workorder-tracking && node server.js`
4. Check for port conflicts: `sudo ss -tlnp | grep :3000`

### Database connection fails

1. Verify MySQL is running: `sudo systemctl status mysql`
2. Test connection: `mysql -u workorder_user -p'<your_db_password>' workorder_tracking`
3. Check .env credentials match MySQL user
4. Review MySQL error log: `sudo tail -f /var/log/mysql/error.log`

### Nginx 502 Bad Gateway

1. Verify Node.js is running: `pm2 status`
2. Test direct connection: `curl http://127.0.0.1:3000`
3. Check Nginx error log: `sudo tail -f /var/log/nginx/error.log`
4. Verify proxy_pass in nginx.conf points to 127.0.0.1:3000

### Cannot access from browser

1. Check firewall: `sudo ufw status`
2. Verify Nginx is running: `sudo systemctl status nginx`
3. Test locally on server: `curl http://localhost/`
4. Check server IP is correct: `ip addr show`

---

## ✅ Final Verification

After completing all steps above, verify:

- [ ] Application loads in browser at http://192.168.1.139
- [ ] Login functionality works
- [ ] Database operations (CRUD) work correctly
- [ ] File uploads work (if applicable)
- [ ] Application survives server reboot (PM2 startup)
- [ ] Logs show no critical errors
- [ ] Performance is acceptable (page load < 2 seconds)

---

## 📝 Notes

**Current Configuration:**
- Local .env: DB_USER=root, DB_PASSWORD=<your_db_password>, NODE_ENV=development
- Production target: DB_USER=workorder_user (recommended), DB_PASSWORD=<your_db_password>, NODE_ENV=production
- Repository: All code committed and pushed to lnwsathit/bst-wot

**Next Steps:**
1. Complete local MySQL password update
2. Deploy to production server following checklist above
3. Verify all functionality works
4. Implement security hardening
5. Set up monitoring and backups

**Important:**
- Never commit .env files to git
- Always use strong, unique SESSION_SECRET in production
- Use dedicated database user (workorder_user) instead of root in production
- Keep Node.js, npm, and MySQL updated for security patches
