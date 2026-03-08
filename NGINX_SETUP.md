# Nginx Setup Guide for Work Order Tracking System

This guide will help you set up nginx as a reverse proxy for the Work Order Tracking application.

## Prerequisites

- Node.js application running on port 3000
- Nginx installed on your system

## Installation

### Option 1: Install with Homebrew (macOS)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install nginx
brew install nginx
```

### Option 2: Install with MacPorts (macOS)

```bash
sudo port install nginx
```

### Option 3: Manual Installation (macOS)

Download from [nginx.org](http://nginx.org/en/download.html) and follow installation instructions.

## Configuration Setup

### Step 1: Locate nginx Configuration Directory

Find your nginx installation directory:

```bash
# For Homebrew installation
nginx -V 2>&1 | grep -o 'conf-path=[^ ]*'

# Common paths:
# - Homebrew: /opt/homebrew/etc/nginx or /usr/local/etc/nginx
# - MacPorts: /opt/local/etc/nginx
# - Manual: /etc/nginx or /usr/local/nginx/conf
```

### Step 2: Copy Configuration File

**Important:** Before proceeding, update the file paths in `nginx.conf` to match your actual installation path if different from:
```
/Volumes/DATA/3. Education/Web Application/2. Tracking system/workorder-tracking/
```

Copy the configuration file:

```bash
# For Homebrew (create sites-available directory if it doesn't exist)
mkdir -p /opt/homebrew/etc/nginx/sites-available
cp nginx.conf /opt/homebrew/etc/nginx/sites-available/workorder-tracking

# OR for standard nginx
sudo cp nginx.conf /etc/nginx/sites-available/workorder-tracking
```

### Step 3: Enable the Site

**For systems with sites-enabled (Ubuntu-style):**

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/workorder-tracking /etc/nginx/sites-enabled/

# Ensure main nginx.conf includes sites-enabled
# Add this line to /etc/nginx/nginx.conf in the http block:
# include /etc/nginx/sites-enabled/*;
```

**For Homebrew nginx:**

Edit `/opt/homebrew/etc/nginx/nginx.conf` and add inside the `http` block:

```nginx
include /opt/homebrew/etc/nginx/sites-available/*;
```

**Or use the config directly:**

```bash
# Replace the default nginx.conf
cp nginx.conf /opt/homebrew/etc/nginx/nginx.conf
```

### Step 4: Create Log Directory

```bash
sudo mkdir -p /var/log/nginx
sudo chown $(whoami) /var/log/nginx
```

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
pm2 startup
```

### Step 2: Start Nginx

**Homebrew:**
```bash
brew services start nginx
# OR
nginx
```

**Manual:**
```bash
sudo nginx
```

### Step 3: Verify Services Running

```bash
# Check nginx is running
ps aux | grep nginx

# Check Node.js is running
ps aux | grep node

# Check port 80 is listening
lsof -i :80

# Check Node.js port 3000 is listening
lsof -i :3000
```

## Testing

### Basic Test

Open your browser and navigate to:
```
http://localhost
```

You should see the Work Order Tracking System login page.

### Test Static Files

```
http://localhost/css/style.css
http://localhost/js/script.js
```

### Test API Endpoints

```bash
# Test health endpoint (if implemented)
curl http://localhost/health

# Test public search
curl http://localhost/api/workorder/search/QT
```

## Nginx Management Commands

### Homebrew Installation

```bash
# Start nginx
brew services start nginx

# Stop nginx
brew services stop nginx

# Restart nginx
brew services restart nginx

# Reload configuration without downtime
nginx -s reload
```

### Manual Installation

```bash
# Start
sudo nginx

# Stop
sudo nginx -s stop

# Quick shutdown
sudo nginx -s quit

# Reload configuration
sudo nginx -s reload

# Test configuration
nginx -t
```

## Troubleshooting

### Port 80 Already in Use

If port 80 is already in use, edit `nginx.conf` and change:
```nginx
listen 80;
```
to another port like:
```nginx
listen 8080;
```

Then access via `http://localhost:8080`

### Permission Denied Errors

```bash
# Give nginx permission to access files
sudo chown -R $(whoami) /Volumes/DATA/3.\ Education/Web\ Application/2.\ Tracking\ system/workorder-tracking/public
sudo chown -R $(whoami) /Volumes/DATA/3.\ Education/Web\ Application/2.\ Tracking\ system/workorder-tracking/uploads
```

### Cannot Connect to Backend

Check that Node.js is running on port 3000:
```bash
curl http://localhost:3000
```

If not working, start the Node.js server:
```bash
cd /Volumes/DATA/3.\ Education/Web\ Application/2.\ Tracking\ system/workorder-tracking
node server.js
```

### View Nginx Logs

```bash
# Access logs
tail -f /var/log/nginx/workorder-tracking-access.log

# Error logs
tail -f /var/log/nginx/workorder-tracking-error.log
```

### 502 Bad Gateway Error

This usually means nginx cannot connect to the Node.js backend. Verify:
1. Node.js server is running on port 3000
2. No firewall blocking localhost connections
3. Check nginx error logs for details

## Performance Optimization (Optional)

### Enable Gzip Compression

Add to `nginx.conf` in the `http` block:

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

## Production Deployment Checklist

- [ ] Install nginx
- [ ] Copy and configure nginx.conf with correct paths
- [ ] Test configuration with `nginx -t`
- [ ] Start Node.js with PM2 for auto-restart
- [ ] Start nginx service
- [ ] Test all endpoints (login, work orders, customers, upload)
- [ ] Set up SSL certificate for HTTPS (recommended)
- [ ] Configure firewall rules
- [ ] Set up log rotation
- [ ] Monitor logs regularly
- [ ] Set up automated backups for MySQL database

## Additional Resources

- [Nginx Documentation](http://nginx.org/en/docs/)
- [Reverse Proxy Guide](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
