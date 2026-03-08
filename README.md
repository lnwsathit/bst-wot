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
- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm

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
   - Edit `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=workorder_tracking
   DB_PORT=3306
   PORT=3000
   SESSION_SECRET=your_secret_key
   NODE_ENV=development
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

## Production Deployment

Before deploying to production:

1. Change `SESSION_SECRET` in `.env` to a secure random string
2. Set `secure: true` in session cookie for HTTPS
3. Use environment-specific `.env` files
4. Set `NODE_ENV=production`
5. Use a production-grade MySQL server
6. Implement SSL/TLS certificates
7. Add rate limiting
8. Configure backup procedures

## Troubleshooting

### Connection issues
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists and user has permissions

### File upload issues
- Check `/uploads` folder permissions
- Ensure files are PDF format only
- Check server disk space

### Module not found
- Run `npm install` again
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

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
