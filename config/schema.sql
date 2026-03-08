-- Create Database
CREATE DATABASE IF NOT EXISTS workorder_tracking;
USE workorder_tracking;

-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('Admin', 'User') DEFAULT 'User',
  status ENUM('Active', 'Disabled') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Work Orders Table
CREATE TABLE IF NOT EXISTS work_orders (
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
  completion_date DATE,
  
  status ENUM('Quotation', 'Customer PO', 'Supplier PO', 'Invoice', 'Completed') DEFAULT 'Quotation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL UNIQUE,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create Default Admin User (password: admin123)
INSERT INTO users (username, password, full_name, role, status) 
VALUES ('admin', '$2a$10$YIjlrVyKZgJZnmQnGCjJeOJ7wfAJc42J0L8pK5N6B0F0C5G8H9I0i', 'Administrator', 'Admin', 'Active');
