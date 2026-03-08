# Work Order Tracking System

A modern web application for tracking work orders from quotation to completion. Includes both a public tracking interface and an internal management dashboard.

## Features

### Public Frontend
- **Search Functionality**: Search orders by quotation number or customer name
- **Timeline View**: Visual timeline showing order progress through 5 stages
- **Responsive Design**: Mobile-friendly interface
- **PDF Attachments**: Download order documents at each stage

### Backend Management
- **Dashboard**: Overview of all work orders with statistics
- **Work Order Management**: Create, edit, and delete work orders
- **User Management**: Admin controls for user accounts
- **Role-Based Access**: Admin and User roles
- **File Upload**: Secure PDF file storage

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js with Express.js
- **Database**: MySQL
- **Authentication**: Session-based with bcrypt password hashing
- **File Upload**: Multer

## Project Structure

```
workorder-tracking/
├── public/                 # Public frontend files
│   ├── index.html         # Tracking page
│   ├── style.css          # Frontend styles
│   └── script.js          # Frontend logic
├── views/                 # Backend templates
│   ├── login.ejs          # Login page
│   ├── dashboard.ejs      # Admin dashboard
│   ├── workorder.ejs      # Work order management
│   └── users.ejs          # User management
├── routes/                # API routes
│   ├── auth.js            # Authentication
│   ├── workorder.js       # Work order endpoints
│   └── users.js           # User management endpoints
├── config/                # Configuration files
│   ├── database.js        # Database connection
│   └── schema.sql         # Database schema
├── uploads/               # Uploaded PDF files
├── server.js              # Express server
├── package.json           # Dependencies
└── .env                   # Environment variables
```

## Installation

### Prerequisites
- Node.js (v16.x or higher, v20.x LTS recommended)
- MySQL (v8.0 or higher)
- npm (v8.x or higher)

### Setup Steps

1. **Clone/Create the project folder**
   ```bash
   cd workorder-tracking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup MySQL Database**
   - Open MySQL and create database:
   ```sql
   mysql -u root -p < config/schema.sql
   ```
   
   Or manually in MySQL:
   ```sql
   CREATE DATABASE IF NOT EXISTS workorder_tracking;
   USE workorder_tracking;
   -- Run the SQL from config/schema.sql
   ```

4. **Configure Environment Variables**
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` file with your production database credentials:
   ```
   DB_HOST=localhost
   DB_USER=workorder_user
   DB_PASSWORD=your_secure_password_here
   DB_NAME=workorder_tracking
   DB_PORT=3306
   PORT=3000
   SESSION_SECRET=your_random_secure_string_of_at_least_32_characters
   NODE_ENV=production
   ```
   - **Important**: Generate a strong SESSION_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public tracking: http://localhost:3000
   - Admin login: http://localhost:3000/login
   - Default credentials:
     - Username: `admin`
     - Password: `admin123`

## Workflow

### 5-Stage Tracking Process

1. **Quotation** - Initial quotation from sales
2. **Customer PO** - Customer purchase order confirmation
3. **Supplier PO** - Purchase order sent to supplier
4. **Invoice** - Invoice generated
5. **Completed** - Order fully completed

Each stage tracks:
- Timestamp (auto-generated)
- Detail (max 30 characters)
- PDF attachment
- Status indicator

## Usage

### For Customers
1. Go to http://localhost:3000
2. Search by quotation number or customer name
3. Click "View Details" to see full timeline
4. Download PDF attachments at each stage

### For Admins
1. Login at http://localhost:3000/login
2. Dashboard: View order statistics
3. Work Orders: 
   - Create new orders
   - Edit existing orders
   - Delete orders (Admin only)
4. Users: Manage system users
   - Create users
   - Edit user details
   - Delete users
   - Set roles and status

## Database Schema

### users table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('Admin', 'User') DEFAULT 'User',
  status ENUM('Active', 'Disabled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### work_orders table
```sql
CREATE TABLE work_orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  customer_name VARCHAR(100) NOT NULL,
  quotation_no VARCHAR(50) NOT NULL UNIQUE,
  quotation_file VARCHAR(255),
  quotation_timestamp DATETIME,
  quotation_detail VARCHAR(30),
  po_customer_no VARCHAR(50),
  po_customer_file VARCHAR(255),
  po_customer_timestamp DATETIME,
  po_customer_detail VARCHAR(30),
  po_supplier_no VARCHAR(50),
  po_supplier_file VARCHAR(255),
  po_supplier_timestamp DATETIME,
  po_supplier_detail VARCHAR(30),
  invoice_no VARCHAR(50),
  invoice_file VARCHAR(255),
  invoice_timestamp DATETIME,
  invoice_detail VARCHAR(30),
  completed_timestamp DATETIME,
  completed_detail VARCHAR(30),
  status ENUM('Quotation', 'Customer PO', 'Supplier PO', 'Invoice', 'Completed'),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Work Orders
- `GET /api/workorder/list` - Get all work orders
- `GET /api/workorder/:id` - Get specific work order
- `POST /api/workorder/create` - Create new work order
- `POST /api/workorder/update/:id` - Update work order
- `DELETE /api/workorder/delete/:id` - Delete work order (admin only)
- `GET /api/workorder/search/:query` - Search work orders

### Users (Admin only)
- `GET /api/users/list` - Get all users
- `POST /api/users/create` - Create new user
- `GET /api/users/:id` - Get specific user
- `POST /api/users/update/:id` - Update user
- `DELETE /api/users/delete/:id` - Delete user

## Security Notes

- Passwords are hashed using bcryptjs
- Session-based authentication with secure cookies
- File uploads restricted to PDF only
- All admin operations require authentication and admin role
- CORS enabled for cross-origin requests

## Production Deployment (Ubuntu 20.04 LTS)

### Prerequisites
- Ubuntu 20.04.6 LTS
- Node.js v16.x or higher (tested with v20.20.1)
- MySQL 8.0 or higher
- Nginx 1.18+
- PM2 6.0+

### Step-by-Step Deployment

1. **Prepare Server Environment**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y

   # Create application user
   sudo useradd -m -s /bin/bash workorder_app
   
   # Create application directory
   sudo mkdir -p /var/www/workorder-tracking
   sudo chown -R workorder_app:workorder_app /var/www/workorder-tracking
   ```

2. **Install Node.js & npm**
   ```bash
   # Using NodeSource repository (recommended for Node.js 20)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Verify installation
   node -v  # should show v20.20.1 or higher
   npm -v   # should show 10.x or higher
   ```

3. **Install and Configure MySQL**
   ```bash
   sudo apt install -y mysql-server

   # On fresh Ubuntu 20.04, MySQL root requires sudo without password:
   # Try the socket connection first (most common):
   sudo mysql -u root << 'EOF'
   CREATE DATABASE IF NOT EXISTS workorder_tracking;
   CREATE USER 'workorder_user'@'localhost' IDENTIFIED BY 'your_secure_password';
   GRANT ALL PRIVILEGES ON workorder_tracking.* TO 'workorder_user'@'localhost';
   FLUSH PRIVILEGES;
   EOF

   # Load database schema
   sudo mysql -u workorder_user -p workorder_tracking < /var/www/workorder-tracking/config/schema.sql
   
   # Verify the new user works
   mysql -u workorder_user -p -e "SELECT DATABASE();"
   ```

   **If you get ERROR 1045 (Access denied):**
   
   ```bash
   # Option 1: Use sudo (Ubuntu 20.04 default for root)
   sudo mysql -u root
   
   # Then in MySQL shell, create the user:
   # CREATE DATABASE IF NOT EXISTS workorder_tracking;
   # CREATE USER 'workorder_user'@'localhost' IDENTIFIED BY 'your_password';
   # GRANT ALL PRIVILEGES ON workorder_tracking.* TO 'workorder_user'@'localhost';
   # FLUSH PRIVILEGES;
   # EXIT;
   
   # Option 2: If fresh MySQL setup and you want to set root password
   sudo mysql_secure_installation
   # Then retry with -p flag: mysql -u root -p
   
   # Option 3: Check MySQL service is running
   sudo systemctl status mysql
   sudo systemctl restart mysql
   ```

4. **Deploy Application Code**
   ```bash
   cd /var/www/workorder-tracking
   sudo git clone https://github.com/lnwsathit/bst-wot.git .

   # Set ownership
   sudo chown -R workorder_app:workorder_app /var/www/workorder-tracking
   ```

5. **Install Dependencies**
   ```bash
   cd /var/www/workorder-tracking
   npm install --production

   # Verify dependencies
   npm list
   ```

6. **Configure Environment**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with actual values
   sudo nano .env
   ```
   
   **Example .env file:**
   ```
   DB_HOST=localhost
   DB_USER=workorder_user
   DB_PASSWORD=your_secure_password
   DB_NAME=workorder_tracking
   DB_PORT=3306
   PORT=3000
   SESSION_SECRET=your_generated_random_string_here
   NODE_ENV=production
   ```

   **Generate secure SESSION_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

7. **Install and Configure PM2**
   ```bash
   sudo npm install -g pm2

   # Start application with PM2
   cd /var/www/workorder-tracking
   pm2 start ecosystem.config.js --env production

   # Save PM2 process list
   pm2 save

   # Create PM2 startup script
   sudo pm2 startup systemd -u workorder_app --hp /home/workorder_app
   ```

8. **Install and Configure Nginx**
   ```bash
   sudo apt install -y nginx

   # Copy nginx configuration
   sudo cp /var/www/workorder-tracking/nginx.conf /etc/nginx/sites-available/workorder-tracking

   # Enable site
   sudo ln -s /etc/nginx/sites-available/workorder-tracking /etc/nginx/sites-enabled/

   # Disable default site
   sudo rm -f /etc/nginx/sites-enabled/default

   # Test configuration
   sudo nginx -t

   # Start and enable nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

9. **Setup Log Directory**
   ```bash
   # Create PM2 log directory
   sudo mkdir -p /var/log/pm2
   sudo chown -R workorder_app:workorder_app /var/log/pm2

   # Verify nginx logs
   sudo mkdir -p /var/log/nginx
   sudo chown -R www-data:www-data /var/log/nginx
   ```

10. **Setup SSL/TLS (Recommended)**
    ```bash
    # Using Let's Encrypt with Certbot
    sudo apt install -y certbot python3-certbot-nginx

    # Generate certificate (replace domain.com with your domain)
    sudo certbot certonly --nginx -d domain.com -d www.domain.com

    # Update nginx config to use SSL (uncomment HTTPS section in nginx.conf)
    # Then restart nginx
    sudo systemctl restart nginx
    ```

11. **Configure Firewall**
    ```bash
    sudo ufw allow 22/tcp   # SSH
    sudo ufw allow 80/tcp   # HTTP
    sudo ufw allow 443/tcp  # HTTPS
    sudo ufw enable
    ```

12. **Test Application**
    ```bash
    # Check PM2 status
    pm2 status

    # Check nginx status
    sudo systemctl status nginx

    # Test connectivity
    curl http://localhost/
    curl http://127.0.0.1:3000/

    # View PM2 logs
    pm2 logs workorder-tracking
    ```

### Post-Deployment Checklist

- [ ] MySQL database created and populated with schema
- [ ] Application dependencies installed (npm install --production)
- [ ] .env file configured with secure passwords and SESSION_SECRET
- [ ] PM2 configured and running application
- [ ] PM2 startup script created for system boot
- [ ] Nginx configured and routing to Node.js (127.0.0.1:3000)
- [ ] Nginx performance settings optimized (gzip, caching)
- [ ] SSL/TLS certificate installed (for production)
- [ ] Firewall rules configured
- [ ] Log files configured and rotation setup
- [ ] Backup procedures documented
- [ ] System monitoring configured

### Maintenance Commands

```bash
# View application status
pm2 status

# View application logs
pm2 logs workorder-tracking

# Restart application
pm2 restart workorder-tracking

# Reload nginx configuration
sudo systemctl reload nginx

# Monitor server resources
top
htop

# Check database size
mysql -u workorder_user -p -e "SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb FROM information_schema.TABLES WHERE table_schema = 'workorder_tracking';"
```

### Updating Application

```bash
cd /var/www/workorder-tracking
git pull origin main
npm install --production
pm2 restart workorder-tracking
```

## Production Deployment

Before deploying to production:

1. Change `SESSION_SECRET` in `.env` to a secure random string
2. Secure cookie is automatically enabled when `NODE_ENV=production`
3. Use environment-specific `.env` files
4. Set `NODE_ENV=production`
5. Use a production-grade MySQL server
6. Implement SSL/TLS certificates (Let's Encrypt recommended)
7. Add rate limiting for API endpoints
8. Configure backup procedures for database
9. Monitor application health and logs
10. Setup error tracking and alerting

## Troubleshooting

### MySQL Connection Issues

**ERROR 1045 (28000): Access denied for user 'root'@'localhost'**

This is common on fresh Ubuntu 20.04 installations where root authentication uses socket connections:

```bash
# Solution 1: Use sudo for root socket connection (most common)
sudo mysql -u root

# Solution 2: If you previously set a root password
mysql -u root -p
# Enter your password when prompted

# Solution 3: Reset root password if forgotten
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;

# Solution 4: Check MySQL service status
sudo systemctl status mysql
sudo systemctl restart mysql
```

**Cannot connect with 'workorder_user':**

```bash
# Verify user was created from root
sudo mysql -u root -e "SELECT user, host FROM mysql.user WHERE user='workorder_user';"

# Check user permissions
sudo mysql -u root << EOF
USE mysql;
SHOW GRANTS FOR 'workorder_user'@'localhost';
EOF

# If permissions are missing, grant them
sudo mysql -u root << EOF
GRANT ALL PRIVILEGES ON workorder_tracking.* TO 'workorder_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Test connection with new user
mysql -u workorder_user -p -e "SELECT DATABASE();"
```

### Connection issues
- Verify MySQL is running: `sudo systemctl status mysql`
- Check database credentials in `.env`
- Ensure database exists: `mysql -u workorder_user -p -e "SHOW DATABASES;"`
- Ensure user has permissions: `sudo mysql -u root -e "SHOW GRANTS FOR 'workorder_user'@'localhost';"`

### File upload issues
- Check `/uploads` folder permissions: `ls -la uploads/`
- Ensure files are PDF format only
- Check server disk space: `df -h`
- Check file ownership: `ls -la uploads/workorder-tracking/`

### Application Won't Start

```bash
# Check Node.js version compatibility
node -v  # should be v16.x or higher

# Check dependencies are installed
npm list --production

# View PM2 logs for errors
pm2 logs workorder-tracking

# Manually test start
node server.js

# Check .env file exists and is readable
cat /var/www/workorder-tracking/.env
```

### Module not found
- Run `npm install`: `npm install --production`
- Delete and reinstall: `rm -rf node_modules && npm install --production`
- Clear npm cache: `npm cache clean --force`
- Check Node version: `node -v` (v16+ required)

### Nginx 502 Bad Gateway

```bash
# Verify Node.js application is running
pm2 status
curl http://127.0.0.1:3000

# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/workorder-tracking-error.log

# Verify proxy setting is correct
grep "proxy_pass" /etc/nginx/sites-available/workorder-tracking
# Should show: proxy_pass http://127.0.0.1:3000;

# Restart both services
pm2 restart workorder-tracking
sudo systemctl restart nginx
```

## Future Enhancements

- Email notifications for status updates
- Document versioning
- Advanced search and filtering
- Export reports to CSV/PDF
- API key authentication for programmatic access
- Multi-language support
- Two-factor authentication

## Support

For issues or questions, please contact the development team.

## License

This project is proprietary and confidential.

---

Last Updated: March 2026
