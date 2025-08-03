#!/bin/bash

# Pre-Deployment Comprehensive Testing Script
# Run this before every deployment to ensure system integrity

set -e

echo "🚀 Pre-Deployment Check Started"
echo "=================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
FRONTEND_URL="https://182679ee.awhittlewandering-site.pages.dev"
API_URL="https://awhittlewandering-api.kd8jc7v8cd.workers.dev"

# Configurable sleep duration (in seconds) for deployment propagation
DEPLOY_PROPAGATION_WAIT_SECONDS="${DEPLOY_PROPAGATION_WAIT_SECONDS:-10}"

# Check for --ci flag
CI_MODE=false
for arg in "$@"; do
    if [[ "$arg" == "--ci" ]]; then
        CI_MODE=true
    fi
done
API_URL="https://awhittlewandering-api.kd8jc7v8cd.workers.dev"

# Configurable sleep duration (in seconds) for deployment propagation
DEPLOY_PROPAGATION_WAIT_SECONDS="${DEPLOY_PROPAGATION_WAIT_SECONDS:-10}"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command succeeded
check_result() {
    if [ $? -eq 0 ]; then
        print_status $GREEN "✅ $1 - PASSED"
    else
        print_status $RED "❌ $1 - FAILED"
        exit 1
    fi
}

# 1. Build Frontend
print_status $BLUE "📦 Building Frontend..."
cd frontend
npm run build
check_result "Frontend Build"

# 2. Build Backend
print_status $BLUE "🔧 Building Backend..."
cd ../backend/edge-worker
npm run build
check_result "Backend Build"

# 3. Run Comprehensive QA Tests
print_status $BLUE "🧪 Running Comprehensive QA Tests..."
cd ../../
node comprehensive-qa-test.js
check_result "Comprehensive QA Tests"

# 4. Run End-to-End Tests
print_status $BLUE "🎯 Running End-to-End Tests..."
node end-to-end-test.js
git status --porcelain
if [ -n "$(git status --porcelain)" ]; then
    print_status $YELLOW "⚠️  Uncommitted changes detected"
    print_status $YELLOW "Files with changes:"
    git status --porcelain
    echo ""
    if [ "$CI_MODE" = true ]; then
        print_status $RED "❌ Uncommitted changes detected in CI mode. Exiting."
        exit 1
    else
        read -p "Do you want to commit these changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            echo -n "Enter commit message: "
            read commit_message
            git commit -m "$commit_message"
            print_status $GREEN "✅ Changes committed"
        else
            print_status $YELLOW "⚠️  Proceeding with uncommitted changes"
        fi
    fi
else
    print_status $GREEN "✅ No uncommitted changes"
fi
    fi
else
    print_status $GREEN "✅ No uncommitted changes"
fi

# 6. Deploy Backend (if needed)
print_status $BLUE "🚀 Deploying Backend..."
cd backend/edge-worker
if command -v wrangler &> /dev/null; then
    wrangler deploy
    check_result "Backend Deployment"
else
    print_status $YELLOW "⚠️  Wrangler not found, skipping backend deployment"
fi

# 7. Deploy Frontend (if needed)
print_status $BLUE "🌐 Deploying Frontend..."
cd ../../frontend
if [ -f "../scripts/deploy.sh" ]; then
    ../scripts/deploy.sh
    check_result "Frontend Deployment"
else
    print_status $YELLOW "⚠️  Deploy script not found, skipping frontend deployment"
fi

# 8. Post-Deployment Validation
print_status $BLUE "✅ Post-Deployment Validation..."
cd ..
sleep "$DEPLOY_PROPAGATION_WAIT_SECONDS"  # Wait for deployments to propagate
node comprehensive-qa-test.js
print_status $GREEN "✅ All systems are GO for production!"
print_status $BLUE "🌐 Frontend: $FRONTEND_URL"
print_status $BLUE "🔧 API: $API_URL"
echo ""
echo ""
print_status $BLUE "🌐 Frontend: https://182679ee.awhittlewandering-site.pages.dev"
print_status $BLUE "🔧 API: https://awhittlewandering-api.kd8jc7v8cd.workers.dev"
echo ""
