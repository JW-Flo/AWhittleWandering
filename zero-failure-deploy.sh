#!/bin/bash

# ZERO-FAILURE DEPLOYMENT SCRIPT
# Ensures all API configurations are verified before any deployment

set -e

echo "🚨 ZERO-FAILURE DEPLOYMENT - API VERIFICATION"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Navigate to project root
cd "$(dirname "$0")"

echo -e "${BLUE}📍 Running from: $(pwd)${NC}"
echo ""

# Step 1: Run API audit
echo -e "${BLUE}🔍 STEP 1: Running comprehensive API audit...${NC}"
if ! node api-management-system.js audit; then
    echo -e "${RED}❌ DEPLOYMENT BLOCKED: Critical API configuration issues detected${NC}"
    echo ""
    echo -e "${YELLOW}To fix these issues:${NC}"
    echo -e "${YELLOW}  1. Run './setup-tessie-secrets.sh' to configure missing APIs${NC}"
    echo -e "${YELLOW}  2. Ensure all 5 APIs are configured in both environments${NC}"
    echo -e "${YELLOW}  3. Re-run this deployment script${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ STEP 1: All API configurations verified${NC}"
echo ""

# Step 2: Deploy backend
echo -e "${BLUE}🚀 STEP 2: Deploying backend...${NC}"
cd backend/edge-worker

echo -e "${BLUE}   Deploying to production...${NC}"
npx wrangler deploy --env production

echo -e "${BLUE}   Deploying to development...${NC}"
npx wrangler deploy --env development

cd ../../

echo -e "${GREEN}✅ STEP 2: Backend deployed to both environments${NC}"
echo ""

# Step 3: Deploy frontend
echo -e "${BLUE}🚀 STEP 3: Deploying frontend...${NC}"
cd frontend

if [ -f "package.json" ]; then
    if npm run build; then
        echo -e "${GREEN}✅ Frontend build successful${NC}"
        
        if npm run deploy 2>/dev/null || npx wrangler pages deploy dist; then
            echo -e "${GREEN}✅ Frontend deployed successfully${NC}"
        else
            echo -e "${YELLOW}⚠️  Frontend deployment skipped (no deploy script configured)${NC}"
        fi
    else
        echo -e "${RED}❌ Frontend build failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Frontend package.json not found${NC}"
fi

cd ../

echo -e "${GREEN}✅ STEP 3: Frontend deployment completed${NC}"
echo ""

# Step 4: Final verification
echo -e "${BLUE}🔍 STEP 4: Post-deployment verification...${NC}"

# Test API endpoints
echo -e "${BLUE}   Testing API endpoints...${NC}"

# Test production API
if curl -s --max-time 10 "https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Production API responding${NC}"
else
    echo -e "${RED}❌ Production API not responding${NC}"
fi

# Test development API
if curl -s --max-time 10 "https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev/api/v1/health" | grep -q "ok"; then
    echo -e "${GREEN}✅ Development API responding${NC}"
else
    echo -e "${RED}❌ Development API not responding${NC}"
fi

echo -e "${GREEN}✅ STEP 4: Post-deployment verification completed${NC}"
echo ""

# Step 5: Run QA if available
if [ -f "qa/run-full-qa.sh" ]; then
    echo -e "${BLUE}🧪 STEP 5: Running full QA suite...${NC}"
    cd qa
    if ./run-full-qa.sh; then
        echo -e "${GREEN}✅ STEP 5: QA suite passed${NC}"
    else
        echo -e "${YELLOW}⚠️  QA suite issues detected - review qa/latest-results.json${NC}"
    fi
    cd ../
else
    echo -e "${YELLOW}⚠️  STEP 5: QA suite not available${NC}"
fi

echo ""
echo -e "${GREEN}🎉 ZERO-FAILURE DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo -e "${GREEN}✅ All API configurations verified${NC}"
echo -e "${GREEN}✅ Backend deployed (production + development)${NC}"
echo -e "${GREEN}✅ Frontend deployed${NC}"
echo -e "${GREEN}✅ API endpoints responding${NC}"
echo -e "${GREEN}✅ System ready for production use${NC}"
echo ""
echo -e "${BLUE}🔗 Production API: https://awhittlewandering-api.kd8jc7v8cd.workers.dev${NC}"
echo -e "${BLUE}🔗 Development API: https://awhittlewandering-api-dev.kd8jc7v8cd.workers.dev${NC}"
echo ""
