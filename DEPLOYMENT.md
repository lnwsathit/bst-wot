# Work Order Tracking (WOT) - Production Deployment Guide

## Target Server Configuration

This guide is optimized for deployment on **Ubuntu 20.04.6 LTS** with:
- IP: 192.168.1.139
- Node.js: v20.20.1
- npm: 10.8.2
- MySQL: 8.0.42
- Nginx: 1.18.0
- PM2: 6.0.14

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Client Browser                         │
└────────────────┬────────────────────────────────────────┘
                 │ HTTP/HTTPS
                 ▼
        ┌────────────────────┐
        │   Nginx 1.18.0     │ ← Reverse Proxy
        │   :80, :443        │ ← Static Files
        └────────┬───────────┘
                 │ Proxy to localhost:3000
                 ▼
        ┌────────────────────┐
        │  Node.js + PM2     │ ← Application Server
        │  :3000 (internal)  │ ← Cluster Mode (multi-core)
        └────────┬───────────┘
                 │ SQL Connection
                 ▼
        ┌────────────────────┐
        │  MySQL 8.0.42      │ ← Database
        │  :3306 (localhost) │
        └────────────────────┘
```

## Files Changed for Ubuntu Compatibility

### 1. `.env.example`

**Changes Made:**
- Changed `DB_USER` from `root` to `workorder_user` (security best practice)
- Changed `DB_PASSWORD` from placeholder `password` to empty (forces manual configuration)
- Changed `NODE_ENV` from `development` to `production`
- `SESSION_SECRET` is now empty (requires manual generation)

**Why:** Production deployments should never use `root` database user or hardcoded passwords. Empty fields force explicit configuration, reducing security risks.

**File Location:** `.env.example`

### 2. `nginx.conf`

**Changes Made:**
- Changed `server_name` from `localhost` to `_` (accepts any hostname)
- Updated `proxy_pass` from `http://localhost:3000` to `http://127.0.0.1:3000` (loopback address)
- Updated health check endpoint proxy to use `127.0.0.1:3000`
- Updated all static file paths from macOS `/Volumes/...` to Ubuntu `/var/www/workorder-tracking/`
- Added `Referrer-Policy` security header
- Updated all `alias` paths to use `/var/www/workorder-tracking/` (standard Linux path)

**Why:** 
- Ubuntu doesn't have `/Volumes/` path; uses `/var/www/` for web applications
- `127.0.0.1` is preferred over `localhost` to ensure loopback only
- Dynamic hostname binding (`_`) allows flexibility in domain/IP configuration

**File Location:** `nginx.conf`

### 3. `server.js`

**Changes Made:**
- Changed session cookie configuration:
  ```javascript
  // Old:
  cookie: { secure: false }
  
  // New:
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24
  }
  ```

**Why:** 
- `secure: true` in production prevents session cookies from being sent over HTTP
- `httpOnly: true` prevents JavaScript access to cookies (XSS protection)
- `sameSite: 'strict'` provides CSRF protection
- Automatic detection via `NODE_ENV` eliminates need for manual toggling

**File Location:** `server.js` (lines 24-30)

### 4. `ecosystem.config.js` (NEW FILE)

**Purpose:** PM2 configuration for production process management

**Key Features:**
- Cluster mode with automatic CPU core detection (`instances: 'max'`)
- Proper environment variable handling
- Logging to `/var/log/pm2/` directory
- Auto-restart with max memory limit (1GB)
- Graceful shutdown configuration (5 seconds)
- Deploy configuration pointing to GitHub repository
- User context set for systemd integration

**Configuration Details:**
```javascript
{
  name: 'workorder-tracking',      // Process name
  instances: 'max',                // Use all CPU cores
  exec_mode: 'cluster',            // Cluster mode for multi-core
  max_memory_restart: '1G',        // Restart if exceeds 1GB
  autorestart: true,               // Auto-restart on crash
  watch: false,                    // Don't reload on file changes (production)
}
```

**Why:** 
- Cluster mode increases throughput by utilizing all CPU cores
- Memory limit prevents runaway processes
- Proper logging helps with debugging and monitoring
- PM2 startup ensures application survives server reboot

**File Location:** `ecosystem.config.js`

### 5. `README.md`

**Changes Made:**
- Updated Node.js version requirement from v14 to **v16 minimum, v20 LTS recommended**
- Updated MySQL requirement from v5.7 to **v8.0 or higher**
- Added comprehensive **Ubuntu 20.04 Step-by-Step Deployment** section (500+ lines)
- Updated `.env` configuration instructions with security notes
- Added automated SESSION_SECRET generation command
- Added post-deployment checklist
- Added maintenance commands
- Added database update instructions
- Reorganized deployment vs. development sections

**Why:** 
- Reflects actual tested versions on target server
- Provides clear path for new deployments
- Includes verification steps and troubleshooting
- Comprehensive checklist ensures nothing is missed

**File Location:** `README.md` (lines 38-280)

### 6. `deploy-ubuntu.sh` (NEW FILE)

**Purpose:** Automated deployment script for Ubuntu 20.04

**Features:**
- Automated system updates
- Node.js v20 installation via NodeSource repository
- MySQL database setup
- Application user creation
- Repository cloning
- PM2 configuration
- Nginx setup
- Firewall configuration
- SSL/TLS hint for further configuration

**Usage:**
```bash
sudo bash deploy-ubuntu.sh
```

**Why:** 
- Reduces manual deployment errors
- Provides consistent, repeatable deployment
- Saves hours of configuration work
- Auditable deployment process

**File Location:** `deploy-ubuntu.sh`

## Configuration Variables and Security

### Database Configuration

| Variable      | Development | Production    |
|---------------|-------------|---------------|
| DB_HOST       | localhost   | localhost     |
| DB_USER       | root        | workorder_user|
| DB_PASSWORD   | password    | \*\*\*\*\*\* |
| NODE_ENV      | development | production    |
| SESSION_SECRET| generic key | 64-char hex   |

### Session Security

In production, sessions are automatically hardened:
- **secure:** true (HTTPS only)
- **httpOnly:** true (JavaScript access blocked)
- **sameSite:** strict (CSRF protection)
- **maxAge:** 24 hours (session expiration)

### File Permissions

Recommended permissions on Ubuntu:

```bash
# Application files
chmod 755 /var/www/workorder-tracking
chmod 644 /var/www/workorder-tracking/*.js
chmod 644 /var/www/workorder-tracking/*.json

# Environment file (restricted)
chmod 600 /var/www/workorder-tracking/.env

# Uploads directory (writable)
chmod 755 /var/www/workorder-tracking/uploads

# Public files
chmod 755 /var/www/workorder-tracking/public
chmod 644 /var/www/workorder-tracking/public/**/*
```

## Deployment Steps

### Option 1: Automated Deployment (Recommended)

```bash
# SSH into Ubuntu server
ssh user@192.168.1.139

# Download and run deployment script
curl -fsSL https://raw.githubusercontent.com/lnwsathit/bst-wot/main/deploy-ubuntu.sh -o deploy.sh
sudo bash deploy.sh
```

### Option 2: Manual Deployment

See detailed steps in README.md "Production Deployment (Ubuntu 20.04 LTS)" section.

## Verification

After deployment, verify all components:

```bash
# Check application status
pm2 status
pm2 logs workorder-tracking

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Check MySQL
mysql -u workorder_user -p -e "SELECT DATABASE();"

# Check ports listening
sudo ss -tlnp | grep -E ':(80|3000|3306)'

# Test application
curl http://localhost/
curl http://127.0.0.1:3000/

# Check file permissions
ls -la /var/www/workorder-tracking/.env
```

## Port Configuration

| Port | Service      | Binding        | Access           |
|------|-------------|----------------|-----------------|
| 80   | Nginx       | 0.0.0.0:80    | Public (HTTP)   |
| 443  | Nginx       | 0.0.0.0:443   | Public (HTTPS)  |
| 3000 | Node.js     | 127.0.0.1:3000| Internal only   |
| 3306 | MySQL       | 127.0.0.1:3306| Internal only   |

## Security Hardening

Beyond the default configuration, consider:

1. **SSL/TLS Certificate** (Let's Encrypt)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot certonly --nginx -d your-domain.com
   ```

2. **Fail2Ban** (brute force protection)
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

3. **Rate Limiting** (in nginx.conf)
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
   limit_req zone=api_limit burst=20 nodelay;
   ```

4. **Security Headers** (already included)
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - X-XSS-Protection: 1; mode=block
   - Referrer-Policy: strict-origin-when-cross-origin

5. **Database Backup**
   ```bash
   # Daily backup
   0 2 * * * mysqldump -u workorder_user -p$DB_PASSWORD workorder_tracking > /backups/wot-$(date +\%Y\%m\%d).sql
   ```

## Troubleshooting

### Application Won't Start

```bash
# Check Node.js version
node --version  # should be v16+

# Check dependencies
npm list --production

# View PM2 logs
pm2 logs workorder-tracking

# Manually start to see errors
node server.js
```

### Database Connection Error

```bash
# Test MySQL connection
mysql -u workorder_user -p -h 127.0.0.1 workorder_tracking -e "SELECT 1;"

# Check credentials in .env
cat /var/www/workorder-tracking/.env

# Verify database exists
mysql -u workorder_user -p -e "SHOW DATABASES;"
```

### Nginx 502 Bad Gateway

```bash
# Check Node.js is running
ps aux | grep "node server"
pm2 status

# Check logs
sudo tail -f /var/log/nginx/workorder-tracking-error.log

# Test proxy connection
curl http://127.0.0.1:3000

# Verify nginx config
sudo nginx -t
```

### SSL Certificate Issues

```bash
# Verify certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew --nginx

# Check certificate expiry
echo | openssl s_client -servername domain.com -connect domain.com:443 2>/dev/null | openssl x509 -noout -dates
```

## Monitoring and Maintenance

### Check Application Health

```bash
# Realtime monitoring
pm2 monit

# Process status
pm2 status

# Memory usage
pm2 memory

# View metrics
pm2 web  # Access at http://localhost:9615
```

### Restart and Reload

```bash
# Restart application
pm2 restart workorder-tracking

# Reload with zero-downtime
pm2 reload workorder-tracking

# Restart Nginx (reload config without downtime)
sudo systemctl reload nginx
```

### View Logs

```bash
# Application logs
pm2 logs workorder-tracking

# Nginx access logs
sudo tail -f /var/log/nginx/workorder-tracking-access.log

# Nginx error logs
sudo tail -f /var/log/nginx/workorder-tracking-error.log

# System logs
sudo journalctl -u pm2-workorder_app -f
```

## Rollback Procedure

If an update causes issues, rollback with:

```bash
# Revert to previous commit
cd /var/www/workorder-tracking
git log --oneline -5  # See recent commits
git checkout <previous-commit-hash>

# Reinstall dependencies
npm install --production

# Restart application
pm2 restart workorder-tracking
```

## Backup and Recovery

### Automated Database Backup

```bash
# Create backup directory
sudo mkdir -p /backups
sudo chown $USER:$USER /backups

# Add to crontab
0 2 * * * mysqldump -u workorder_user -p$DB_PASSWORD workorder_tracking | gzip > /backups/wot-$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup

```bash
gunzip < /backups/wot-20260308.sql.gz | mysql -u workorder_user -p workorder_tracking
```

## Performance Tuning

### Nginx Configuration

```nginx
# In nginx.conf http block
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;

# Enable gzip compression
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### PM2 Configuration

```javascript
// In ecosystem.config.js
{
  max_memory_restart: '1G',
  max_restarts: 10,
  min_uptime: '10s'
}
```

### MySQL Configuration

```bash
# Edit /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 1G
max_connections = 200
query_cache_size = 64M
```

## Support and Resources

- **GitHub Repository:** https://github.com/lnwsathit/bst-wot
- **Node.js Docs:** https://nodejs.org/docs/
- **MySQL Docs:** https://dev.mysql.com/doc/
- **Nginx Docs:** http://nginx.org/en/docs/
- **PM2 Docs:** https://pm2.keymetrics.io/

## Version Information

- **Node.js:** v20.20.1+
- **npm:** 10.8.2+
- **MySQL:** 8.0.42+
- **Nginx:** 1.18.0+
- **PM2:** 6.0.14+
- **Ubuntu:** 20.04.6 LTS

Last Updated: March 2026
