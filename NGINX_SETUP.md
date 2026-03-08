# Nginx Setup Guide for Work Order Tracking System

This guide will help you set up nginx as a reverse proxy for the Work Order Tracking application on Ubuntu 20.04.6 LTS.

## Prerequisites

- Ubuntu 20.04.6 LTS server
- Node.js application running on port 3000
- Nginx 1.18.0 installed on your system
- Server IP: 192.168.1.139

## Installation

### Ubuntu 20.04 LTS (Production)

```bash
# Update package lists
sudo apt update

# Install nginx
sudo apt install -y nginx

# Verify installation
nginx -v  # should show: nginx version: nginx/1.18.0 (Ubuntu)

# Check nginx status
sudo systemctl status nginx
```

### macOS (Development Only)

```bash
# Install with Homebrew
brew install nginx

# Or with MacPorts
sudo port install nginx
```

## Configuration Setup for Ubuntu 20.04

### Step 1: Copy Configuration File

The repository includes a pre-configured `nginx.conf` file optimized for Ubuntu deployment:

```bash
# Copy nginx configuration to sites-available
sudo cp /var/www/workorder-tracking/nginx.conf /etc/nginx/sites-available/workorder-tracking

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Enable the Work Order Tracking site
sudo ln -s /etc/nginx/sites-available/workorder-tracking /etc/nginx/sites-enabled/

### Step 5: Test Configuration

```bash
nginx -t
```

Expected output:
```
nginx: the configuration file /path/to/nginx.conf syntax is ok
nginx: configuration file /path/to/nginx.conf test is successful
```

## Starting Services

### Step 1: Start Node.js Application

In the project directory:

```bash
cd /Volumes/DATA/3.\ Education/Web\ Application/2.\ Tracking\ system/workorder-tracking
node server.js &
```

Or use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name workorder-tracking
pm2 save
```

### Step 2: Test Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t

# Expected output:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 3: Start/Restart Nginx

```bash
# Start nginx (if not running)
sudo systemctl start nginx

# Restart nginx to apply new configuration
sudo systemctl restart nginx

# Enable nginx to start on boot
sudo systemctl enable nginx

# Check nginx status
sudo systemctl status nginx
```

### Step 4: Verify Services Running

```bash
# Check nginx is running
sudo systemctl status nginx

# Check Node.js is running (via PM2)
pm2 status

# Check port 80 is listening
sudo ss -tlnp | grep :80

# Check Node.js port 3000 is listening (internal only)
sudo ss -tlnp | grep :3000
```

## Testing

### Basic Test

Open your browser and navigate to:
```
http://192.168.1.139
```

You should see the Work Order Tracking System public search page.

### Test Admin Login

```
http://192.168.1.139/login
```

### Test from Server (localhost)

```bash
# Test direct Node.js connection
curl http://127.0.0.1:3000/

# Test via Nginx proxy
curl http://localhost/

# Test public IPv4
curl http://192.168.1.139/
```

### Test API Endpoints

```bash
# Test public search
curl http://192.168.1.139/api/workorder/search/QT

# View response with formatting
curl -s http://192.168.1.139/api/workorder/search/QT | json_pp
```

## Nginx Management Commands (Ubuntu 20.04)

### Service Management

```bash
# Start nginx
sudo systemctl start nginx

# Stop nginx
sudo systemctl stop nginx

# Restart nginx (applies new configuration)
sudo systemctl restart nginx

# Reload configuration without downtime
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# Enable on boot
sudo systemctl enable nginx

# Disable on boot
sudo systemctl disable nginx
```

### Configuration Testing

```bash
# Test configuration without applying
sudo nginx -t

# Test and reload if successful
sudo nginx -t && sudo systemctl reload nginx
```

### View Logs

```bash
# Access logs (real-time)
sudo tail -f /var/log/nginx/workorder-tracking-access.log

# Error logs (real-time)
sudo tail -f /var/log/nginx/workorder-tracking-error.log

# View last 50 lines of errors
sudo tail -50 /var/log/nginx/workorder-tracking-error.log
```

## Troubleshooting

### Port 80 Already in Use

Check what's using port 80:
```bash
sudo ss -tlnp | grep :80
sudo lsof -i :80
```

If Apache is running:
```bash
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Permission Denied Errors

Ensure correct file permissions for Ubuntu:
```bash
# Set proper ownership for application directory
sudo chown -R workorder_app:workorder_app /var/www/workorder-tracking

# Ensure nginx can read static files (755 for directories, 644 for files)
sudo chmod 755 /var/www/workorder-tracking/public
sudo chmod -R 644 /var/www/workorder-tracking/public/*
sudo find /var/www/workorder-tracking/public -type d -exec chmod 755 {} \;

# Ensure nginx can read uploaded files
sudo chmod 755 /var/www/workorder-tracking/uploads
```

If you see permission errors in logs, check SELinux/AppArmor settings:
```bash
# Check AppArmor status (Ubuntu default)
sudo aa-status

# If needed, put nginx in complain mode temporarily
sudo aa-complain /usr/sbin/nginx
```

### Cannot Connect to Backend

Check that Node.js is running on port 3000:
```bash
# Test direct connection to Node.js
curl http://127.0.0.1:3000/

# Check PM2 status
pm2 status workorder-tracking

# View PM2 logs
pm2 logs workorder-tracking
```

If not working, start the Node.js server:
```bash
cd /var/www/workorder-tracking
pm2 start ecosystem.config.js --env production
```

### 502 Bad Gateway Error

This usually means nginx cannot connect to the Node.js backend. Verify:

1. **Node.js server is running:**
   ```bash
   pm2 status
   sudo ss -tlnp | grep :3000
   ```

2. **Check nginx error logs for details:**
   ```bash
   sudo tail -50 /var/log/nginx/workorder-tracking-error.log
   ```

3. **Verify proxy_pass setting:**
   ```bash
   grep "proxy_pass" /etc/nginx/sites-available/workorder-tracking
   # Should show: proxy_pass http://127.0.0.1:3000;
   ```

4. **Restart both services:**
   ```bash
   pm2 restart workorder-tracking
   sudo systemctl restart nginx
   ```

### 403 Forbidden Error

Check file permissions and nginx user:
```bash
# Check nginx user
ps aux | grep nginx | grep -v grep

# Usually runs as www-data on Ubuntu
# Ensure www-data can read application files
sudo chown -R www-data:www-data /var/www/workorder-tracking/public
sudo chown -R www-data:www-data /var/www/workorder-tracking/uploads
```

## Performance Optimization (Optional)

### Enable Gzip Compression

Add to `/etc/nginx/nginx.conf` in the `http` block:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss;
```

### Enable Caching

The configuration already includes basic caching for static files. For additional caching, add a cache zone in the `http` block:

```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=100m inactive=60m;
```

## Production Deployment Checklist (Ubuntu 20.04)

- [ ] Ubuntu 20.04.6 LTS server ready
- [ ] Node.js v20.20.1 installed
- [ ] MySQL 8.0.42 installed and configured
- [ ] Nginx 1.18.0 installed
- [ ] PM2 6.0.14 installed globally
- [ ] Application deployed to `/var/www/workorder-tracking`
- [ ] `.env` file configured with database credentials
- [ ] Copy nginx.conf to `/etc/nginx/sites-available/workorder-tracking`
- [ ] Enable site with symlink to `/etc/nginx/sites-enabled/`
- [ ] Test configuration with `sudo nginx -t`
- [ ] Start Node.js with `pm2 start ecosystem.config.js --env production`
- [ ] Configure PM2 startup script: `pm2 startup systemd`
- [ ] Save PM2 process list: `pm2 save`
- [ ] Start nginx: `sudo systemctl start nginx`
- [ ] Enable nginx on boot: `sudo systemctl enable nginx`
- [ ] Test application at `http://192.168.1.139`
- [ ] Test admin login at `http://192.168.1.139/login`
- [ ] Configure UFW firewall (ports 22, 80, 443)
- [ ] Set up SSL certificate with Let's Encrypt (optional)
- [ ] Configure log rotation: `/etc/logrotate.d/nginx`
- [ ] Set up automated MySQL backups
- [ ] Monitor logs: `pm2 monit` and nginx logs

## SSL/TLS Setup with Let's Encrypt (Optional)

For production deployment with HTTPS:

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Certificate will auto-renew before expiration
```

## Firewall Configuration (UFW)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## System Information

Target Production Server:
- **OS:** Ubuntu 20.04.6 LTS (ubuntu-20.04.6-live-server-amd64)
- **Server IP:** 192.168.1.139
- **Nginx:** 1.18.0 (Ubuntu)
- **PM2:** 6.0.14
- **Git:** 2.25.1
- **Node.js:** v20.20.1
- **npm:** 10.8.2
- **MySQL:** 8.0.42 for Linux on x86_64

Application Access:
- **Public:** http://192.168.1.139
- **Admin Login:** http://192.168.1.139/login
- **Default Credentials:** admin / admin123 (change immediately!)

## Additional Resources

- [Nginx Documentation](http://nginx.org/en/docs/)
- [Nginx Reverse Proxy Guide](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [PM2 Startup Script](https://pm2.keymetrics.io/docs/usage/startup/)
- [Let's Encrypt SSL](https://letsencrypt.org/)
- [Ubuntu Server Guide](https://ubuntu.com/server/docs)
