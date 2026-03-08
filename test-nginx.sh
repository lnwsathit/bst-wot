#!/bin/bash

# Work Order Tracking System - Nginx Test Script
# This script tests the nginx configuration and verifies all services are running

echo "=================================="
echo "Nginx Configuration Test Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if nginx is installed
echo -n "Checking nginx installation... "
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✓ Installed${NC}"
    NGINX_VERSION=$(nginx -v 2>&1 | cut -d'/' -f2)
    echo "  Version: $NGINX_VERSION"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo ""
    echo "Please install nginx first:"
    echo "  brew install nginx"
    exit 1
fi

echo ""

# Check if Node.js is running on port 3000
echo -n "Checking Node.js server (port 3000)... "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
    NODE_PID=$(lsof -Pi :3000 -sTCP:LISTEN -t)
    echo "  PID: $NODE_PID"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "${YELLOW}  Start with: node server.js${NC}"
fi

echo ""

# Check if nginx is running
echo -n "Checking nginx process... "
if pgrep -x nginx > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    NGINX_PID=$(pgrep -x nginx | head -1)
    echo "  PID: $NGINX_PID"
else
    echo -e "${RED}✗ Not running${NC}"
    echo -e "${YELLOW}  Start with: nginx or brew services start nginx${NC}"
fi

echo ""

# Check if port 80 is listening
echo -n "Checking nginx port (80)... "
if lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Listening${NC}"
else
    echo -e "${RED}✗ Not listening${NC}"
    echo -e "${YELLOW}  Check if nginx is running and configured correctly${NC}"
fi

echo ""

# Test nginx configuration
echo -n "Testing nginx configuration... "
if nginx -t >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Valid${NC}"
else
    echo -e "${RED}✗ Invalid${NC}"
    echo ""
    echo "Configuration errors:"
    nginx -t
    exit 1
fi

echo ""
echo "=================================="
echo "HTTP Endpoint Tests"
echo "=================================="
echo ""

# Test if both services are running before HTTP tests
if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 || ! lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}Skipping HTTP tests - services not fully running${NC}"
    exit 0
fi

# Test root endpoint
echo -n "Testing http://localhost/ ... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ $HTTP_CODE${NC}"
else
    echo -e "${RED}✗ $HTTP_CODE${NC}"
fi

# Test static CSS
echo -n "Testing static CSS files... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/css/style.css 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ $HTTP_CODE${NC}"
else
    echo -e "${YELLOW}⚠ $HTTP_CODE (file may not exist)${NC}"
fi

# Test API endpoint
echo -n "Testing API endpoint... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/workorder/search/QT 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✓ $HTTP_CODE${NC}"
else
    echo -e "${YELLOW}⚠ $HTTP_CODE${NC}"
fi

# Test direct Node.js connection
echo -n "Testing direct Node.js connection... "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ 2>/dev/null)
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✓ $HTTP_CODE${NC}"
else
    echo -e "${RED}✗ $HTTP_CODE${NC}"
fi

echo ""
echo "=================================="
echo "Summary"
echo "=================================="
echo ""

ALL_OK=true

if ! command -v nginx &> /dev/null; then
    echo -e "${RED}✗ Nginx is not installed${NC}"
    ALL_OK=false
fi

if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Node.js server is not running on port 3000${NC}"
    ALL_OK=false
fi

if ! pgrep -x nginx > /dev/null; then
    echo -e "${RED}✗ Nginx is not running${NC}"
    ALL_OK=false
fi

if ! lsof -Pi :80 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Nginx is not listening on port 80${NC}"
    ALL_OK=false
fi

if [ "$ALL_OK" = true ]; then
    echo -e "${GREEN}✓ All systems operational!${NC}"
    echo ""
    echo "Access your application at: http://localhost"
    echo ""
    echo "Useful commands:"
    echo "  - View nginx access logs: tail -f /var/log/nginx/workorder-tracking-access.log"
    echo "  - View nginx error logs: tail -f /var/log/nginx/workorder-tracking-error.log"
    echo "  - Reload nginx config: nginx -s reload"
    echo "  - Stop nginx: nginx -s stop"
    echo "  - Stop Node.js: pkill -f 'node server.js'"
else
    echo ""
    echo -e "${YELLOW}Some services are not running. Please check the issues above.${NC}"
    echo ""
    echo "Quick start guide:"
    echo "  1. Start Node.js: cd workorder-tracking && node server.js &"
    echo "  2. Start nginx: nginx (or brew services start nginx)"
    echo "  3. Run this test again: ./test-nginx.sh"
fi

echo ""
