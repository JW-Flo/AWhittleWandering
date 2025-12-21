#!/bin/bash

# Fix D1 Database Connectivity and Sync Secrets
# Comprehensive script to resolve database issues and sync credentials

set -e

echo "🔧 Fixing D1 Database Connectivity and Syncing Secrets"
echo "========================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

cd backend/edge-worker

echo -e "${BLUE}📋 Step 1: Checking D1 Database Configuration...${NC}"
echo ""

# Check wrangler.toml for database config
if [ -f "wrangler.toml" ]; then
    echo -e "${GREEN}✅ wrangler.toml found${NC}"
    
    # Extract database info
    DB_NAME=$(grep -A 2 "\[\[d1_databases\]\]" wrangler.toml | grep "database_name" | cut -d'"' -f2 || echo "")
    DB_ID=$(grep -A 2 "\[\[d1_databases\]\]" wrangler.toml | grep "database_id" | cut -d'"' -f2 || echo "")
    BINDING=$(grep -A 2 "\[\[d1_databases\]\]" wrangler.toml | grep "binding" | cut -d'"' -f2 || echo "")
    
    if [ -n "$DB_NAME" ]; then
        echo -e "${GREEN}  Database Name: $DB_NAME${NC}"
    fi
    if [ -n "$DB_ID" ]; then
        echo -e "${GREEN}  Database ID: $DB_ID${NC}"
    fi
    if [ -n "$BINDING" ]; then
        echo -e "${GREEN}  Binding: $BINDING${NC}"
    fi
else
    echo -e "${RED}❌ wrangler.toml not found${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}🔍 Step 2: Verifying D1 Database Exists...${NC}"
echo ""

# Check if wrangler is available
if ! command -v wrangler &> /dev/null && ! command -v npx &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler not found. Install: npm install -g wrangler${NC}"
    echo -e "${YELLOW}   Or use: npx wrangler${NC}"
else
    # Try to list databases
    echo -e "${BLUE}Checking D1 databases...${NC}"
    if npx wrangler d1 list 2>&1 | head -20; then
        echo -e "${GREEN}✅ D1 databases accessible${NC}"
        
        # Check if our database exists
        if npx wrangler d1 list 2>&1 | grep -q "$DB_NAME"; then
            echo -e "${GREEN}✅ Database '$DB_NAME' found in Cloudflare${NC}"
        else
            echo -e "${YELLOW}⚠️  Database '$DB_NAME' not found - may need to be created${NC}"
            echo -e "${YELLOW}   Run: npx wrangler d1 create $DB_NAME${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Could not list databases (authentication needed)${NC}"
        echo -e "${YELLOW}   Run: npx wrangler login${NC}"
    fi
fi

echo ""
echo -e "${BLUE}📦 Step 3: Checking Database Migrations...${NC}"
echo ""

if [ -d "migrations" ]; then
    MIGRATION_COUNT=$(ls -1 migrations/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Migrations directory found${NC}"
    echo -e "${BLUE}  Migration files: $MIGRATION_COUNT${NC}"
    
    if [ $MIGRATION_COUNT -gt 0 ]; then
        echo -e "${BLUE}  Migration files:${NC}"
        ls -1 migrations/*.sql | head -5
        echo ""
        echo -e "${YELLOW}⚠️  Ensure migrations are applied:${NC}"
        echo -e "${YELLOW}   npx wrangler d1 migrations apply $DB_NAME${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Migrations directory not found${NC}"
fi

echo ""
echo -e "${BLUE}🔄 Step 4: Syncing Secrets to Cloudflare Workers...${NC}"
echo ""

# Check GitHub CLI
if command -v gh &> /dev/null && gh auth status &> /dev/null 2>&1; then
    echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
    
    # Check if secrets exist
    SECRET_LIST=$(gh secret list 2>&1 || echo "")
    
    REQUIRED_SECRETS=("TESSIE_API_KEY" "TESLA_VIN" "MAPBOX_ACCESS_TOKEN" "OPENWEATHER_API_KEY" "JWT_SECRET")
    SYNCED=0
    
    for secret in "${REQUIRED_SECRETS[@]}"; do
        if echo "$SECRET_LIST" | grep -q "$secret"; then
            echo -e "${BLUE}  Syncing $secret...${NC}"
            SECRET_VALUE=$(gh secret get "$secret" 2>/dev/null || echo "")
            
            if [ -n "$SECRET_VALUE" ]; then
                # Check if Cloudflare is authenticated
                if npx wrangler whoami &> /dev/null; then
                    echo "$SECRET_VALUE" | npx wrangler secret put "$secret" 2>&1 | grep -v "Enter a secret value" || true
                    echo -e "${GREEN}    ✅ $secret synced${NC}"
                    SYNCED=$((SYNCED + 1))
                else
                    echo -e "${YELLOW}    ⚠️  Cloudflare not authenticated - skipping${NC}"
                    echo -e "${YELLOW}    Run: npx wrangler login${NC}"
                    break
                fi
            else
                echo -e "${YELLOW}    ⚠️  Could not retrieve $secret${NC}"
            fi
        else
            echo -e "${YELLOW}    ⚠️  $secret not found in GitHub Secrets${NC}"
        fi
    done
    
    echo ""
    echo -e "${BLUE}Sync Status: $SYNCED/${#REQUIRED_SECRETS[@]} secrets${NC}"
    
    if [ $SYNCED -lt ${#REQUIRED_SECRETS[@]} ]; then
        echo -e "${YELLOW}⚠️  Some secrets may need manual sync${NC}"
        echo -e "${YELLOW}   Or use GitHub Actions workflow: Sync Secrets to Cloudflare Workers${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not authenticated${NC}"
    echo -e "${YELLOW}   Cannot sync automatically${NC}"
    echo ""
    echo -e "${BLUE}📝 Manual Sync Instructions:${NC}"
    echo "  1. Go to: https://github.com/[OWNER]/[REPO]/actions"
    echo "  2. Find: 'Sync Secrets to Cloudflare Workers'"
    echo "  3. Click: 'Run workflow'"
    echo "  4. Select branch and run"
fi

echo ""
echo -e "${BLUE}🔍 Step 5: Verifying Configuration...${NC}"
echo ""

# Verify secrets
if npx wrangler secret list 2>&1 | head -10; then
    echo -e "${GREEN}✅ Secrets list retrieved${NC}"
else
    echo -e "${YELLOW}⚠️  Could not list secrets (may need authentication)${NC}"
fi

# Test database connection
echo ""
echo -e "${BLUE}🧪 Step 6: Testing Database Connection...${NC}"
echo ""

if [ -n "$DB_NAME" ]; then
    echo -e "${BLUE}Testing connection to $DB_NAME...${NC}"
    if npx wrangler d1 execute "$DB_NAME" --command="SELECT 1" 2>&1 | head -10; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${YELLOW}⚠️  Database connection test failed${NC}"
        echo -e "${YELLOW}   This may be normal if database needs to be created or migrations applied${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Configuration check complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. If database doesn't exist: npx wrangler d1 create $DB_NAME"
echo "  2. Apply migrations: npx wrangler d1 migrations apply $DB_NAME"
echo "  3. Verify secrets: npx wrangler secret list"
echo "  4. Test backend: curl https://awhittlewandering-api.kd8jc7v8cd.workers.dev/api/v1/health"
