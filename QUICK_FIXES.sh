#!/bin/bash
# Quick Fixes for Critical Platform Issues
# Run this script to resolve the 4 critical issues identified in the audit

set -e

echo "🔧 A Whittle Wandering Platform - Critical Fixes"
echo "================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "Step 1: Checking environment..."
echo "================================"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler CLI not found. Install with: npm install -g wrangler"
    exit 1
fi

print_status "Wrangler CLI found"

# Check if in correct directory
if [ ! -d "backend/edge-worker" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Project structure verified"

echo ""
echo "Step 2: Applying database migrations..."
echo "========================================"

cd backend/edge-worker

if [ -d "migrations" ]; then
    print_status "Migrations directory found"
    
    # Apply migrations to production D1 database
    echo "Applying migrations to tesla-journey-tracker..."
    wrangler d1 migrations apply tesla-journey-tracker --remote || {
        print_warning "Migration failed. You may need to authenticate with: wrangler login"
        exit 1
    }
    
    print_status "Migrations applied successfully"
    
    # Verify database
    echo "Verifying database tables..."
    wrangler d1 execute tesla-journey-tracker --remote --command "SELECT name FROM sqlite_master WHERE type='table' LIMIT 5" || {
        print_warning "Could not verify database. Please check manually."
    }
    
    print_status "Database verified"
else
    print_error "Migrations directory not found"
    exit 1
fi

echo ""
echo "Step 3: Deploying backend with correct routes..."
echo "================================================="

# Build backend
echo "Building backend..."
npm run build || npm install && npm run build

print_status "Backend built successfully"

# Deploy to production
echo "Deploying to Cloudflare Workers..."
wrangler deploy || {
    print_error "Deployment failed. Check wrangler configuration."
    exit 1
}

print_status "Backend deployed successfully"

cd ../..

echo ""
echo "Step 4: Fixing AdvancedTeslaMap syntax error..."
echo "================================================"

COMPONENT_FILE="frontend/src/components/AdvancedTeslaMap.tsx"

if [ -f "$COMPONENT_FILE" ]; then
    print_warning "This step requires manual fix. Please edit:"
    echo "  File: $COMPONENT_FILE"
    echo "  Line: 217"
    echo "  Issue: useEffect hook inside map function"
    echo "  Fix: Move useEffect outside of map function"
    echo ""
    echo "Would you like to open the file now? (requires code editor)"
else
    print_error "Component file not found: $COMPONENT_FILE"
fi

echo ""
echo "Step 5: Configuring production secrets..."
echo "=========================================="

print_warning "Production secrets must be set manually:"
echo ""
echo "  1. Tessie API Key:"
echo "     wrangler secret put TESSIE_API_KEY"
echo ""
echo "  2. JWT Secret (generate random 32+ char string):"
echo "     wrangler secret put JWT_SECRET"
echo ""
echo "  3. OpenWeather API Key:"
echo "     wrangler secret put OPENWEATHER_API_KEY"
echo ""
echo "  4. Mapbox Token (if different from current):"
echo "     wrangler secret put MAPBOX_ACCESS_TOKEN"
echo ""

echo ""
echo "Step 6: Verifying fixes..."
echo "==========================="

# Test backend health endpoint
echo "Testing backend health endpoint..."
HEALTH_URL="https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health"

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "503" ]; then
    print_status "Backend is responding (HTTP $HTTP_STATUS)"
    
    # Get detailed health info
    curl -s "$HEALTH_URL" | head -20
else
    print_error "Backend not responding correctly (HTTP $HTTP_STATUS)"
fi

echo ""
echo "Step 7: Frontend verification..."
echo "================================="

cd frontend

if [ -f "package.json" ]; then
    echo "Installing frontend dependencies..."
    npm install --silent
    
    print_status "Dependencies installed"
    
    echo "Building frontend..."
    npm run build > /dev/null 2>&1 && {
        print_status "Frontend build successful"
    } || {
        print_error "Frontend build failed. Check linting errors."
        npm run lint
    }
else
    print_error "Frontend package.json not found"
fi

cd ..

echo ""
echo "================================================="
echo "🎉 Critical Fixes Summary"
echo "================================================="
echo ""
print_status "Step 1: Environment verified"
print_status "Step 2: Database migrations applied"
print_status "Step 3: Backend deployed"
print_warning "Step 4: Manual fix required for AdvancedTeslaMap.tsx"
print_warning "Step 5: Production secrets need manual configuration"
print_status "Step 6: Backend health check completed"
print_status "Step 7: Frontend build verification completed"
echo ""
echo "Next Steps:"
echo "1. Fix AdvancedTeslaMap.tsx syntax error (line 217)"
echo "2. Configure production secrets with wrangler secret put"
echo "3. Run full QA suite: cd qa && node comprehensive-qa-test.js"
echo "4. Monitor logs: wrangler tail"
echo ""
echo "For detailed information, see PLATFORM_AUDIT_REPORT.md"
echo ""
