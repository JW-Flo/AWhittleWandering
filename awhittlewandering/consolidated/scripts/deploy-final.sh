#!/bin/bash
#
# 48 Continental USA - Final Deployment Script
#
# This script automates the final deployment process for the 48 Continental USA road trip tracking system.
# It implements the steps outlined in docs/context/FINAL_DEPLOYMENT_STEPS.md.
#

# ANSI colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}        48 CONTINENTAL USA FINAL DEPLOYMENT                 ${NC}"
echo -e "${BLUE}============================================================${NC}"
echo -e "Run time: $(date)"
echo -e "${BLUE}============================================================${NC}\n"

# Function to confirm action
confirm() {
  read -p "$1 (y/n): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    return 1
  fi
  return 0
}

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo -e "${YELLOW}Checking dependencies...${NC}"

MISSING_DEPS=0
for cmd in node npm npx jq curl; do
  if ! command_exists $cmd; then
    echo -e "${RED}✗ $cmd is not installed${NC}"
    MISSING_DEPS=1
  else
    echo -e "${GREEN}✓ $cmd is installed${NC}"
  fi
done

if [ $MISSING_DEPS -eq 1 ]; then
  echo -e "\n${RED}Please install missing dependencies and try again.${NC}"
  exit 1
fi

# Check if we're in the right directory
if [ ! -d "edge-worker" ] || [ ! -d "48Continental_Starter" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  exit 1
fi

# Step 1: Choose domain strategy
echo -e "\n${BLUE}STEP 1: Choose Domain Strategy${NC}"
echo -e "${YELLOW}Please select the domain strategy to use:${NC}"
echo -e "  ${GREEN}A${NC}: Use workers.dev domain (simpler, already working)"
echo -e "      Edge Worker: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"
echo -e "      Public Site: https://main.continentalusa-site.pages.dev"
echo -e "  ${GREEN}B${NC}: Use custom domain (more professional, requires additional setup)"
echo -e "      Edge Worker: https://trip.thewanderingwhittle.com"
echo -e "      Public Site: Could also use custom domain"

read -p "Enter your choice (A/B): " -n 1 -r DOMAIN_CHOICE
echo

USE_CUSTOM_DOMAIN=false
if [[ $DOMAIN_CHOICE =~ ^[Bb]$ ]]; then
  USE_CUSTOM_DOMAIN=true
  echo -e "${YELLOW}You've chosen to use a custom domain.${NC}"
  
  # Ask for custom domain if choosing option B
  read -p "Enter your custom domain (default: trip.thewanderingwhittle.com): " CUSTOM_DOMAIN
  CUSTOM_DOMAIN=${CUSTOM_DOMAIN:-trip.thewanderingwhittle.com}
  
  echo -e "${YELLOW}Custom domain set to: ${CUSTOM_DOMAIN}${NC}"
  
  # Warning about domain registration
  echo -e "${RED}WARNING: This script does not register the domain for you.${NC}"
  echo -e "${RED}You must ensure the domain is registered and DNS is configured in Cloudflare.${NC}"
  
  if ! confirm "Have you registered this domain and configured DNS in Cloudflare?"; then
    echo -e "${YELLOW}Please register the domain and configure DNS, then run this script again.${NC}"
    exit 1
  fi
else
  echo -e "${YELLOW}You've chosen to use the workers.dev domain.${NC}"
fi

# Step 2: Update configuration files
echo -e "\n${BLUE}STEP 2: Update Configuration Files${NC}"

# Update .env.production for the public site
echo -e "${YELLOW}Updating public site environment variables...${NC}"

ENV_PROD_FILE="48Continental_Starter/public-site/.env.production"
MAPBOX_TOKEN=$(grep REACT_APP_MAPBOX_TOKEN "$ENV_PROD_FILE" 2>/dev/null | cut -d '=' -f2 || echo "pk.your_mapbox_token_here")

if [ "$USE_CUSTOM_DOMAIN" = true ]; then
  API_URL="https://${CUSTOM_DOMAIN}"
else
  API_URL="https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev"
fi

echo -e "REACT_APP_API_URL=${API_URL}" > "$ENV_PROD_FILE"
echo -e "REACT_APP_MAPBOX_TOKEN=${MAPBOX_TOKEN}" >> "$ENV_PROD_FILE"
echo -e "REACT_APP_VERSION=1.0.0" >> "$ENV_PROD_FILE"

echo -e "${GREEN}✓ Updated ${ENV_PROD_FILE}${NC}"

# Update wrangler.toml
echo -e "${YELLOW}Updating edge worker configuration...${NC}"
cd edge-worker

if [ "$USE_CUSTOM_DOMAIN" = true ]; then
  # Update wrangler.toml for custom domain
  node -e "
    const fs = require('fs');
    const path = require('path');
    const toml = fs.readFileSync('wrangler.toml', 'utf8');
    
    // Make sure workers_dev is true to keep workers.dev domain as fallback
    let updatedToml = toml.replace(/workers_dev\s*=\s*(true|false)/, 'workers_dev = true');
    
    // Update routes
    if (updatedToml.includes('[routes]')) {
      // Replace existing routes
      updatedToml = updatedToml.replace(/\[\s*routes\s*\][^\[]*(\[|$)/, '[routes]\npattern = \"https://${CUSTOM_DOMAIN}/*\"\nzone_name = \"${CUSTOM_DOMAIN.split('.').slice(-2).join('.')}\"\\n$1');
    } else {
      // Add routes section
      updatedToml += '\n[routes]\npattern = \"https://${CUSTOM_DOMAIN}/*\"\nzone_name = \"${CUSTOM_DOMAIN.split('.').slice(-2).join('.')}\"\\n';
    }
    
    fs.writeFileSync('wrangler.toml', updatedToml);
  "
  echo -e "${GREEN}✓ Updated wrangler.toml with custom domain${NC}"
else
  # Run the fix-deployment-routes.cjs script to ensure workers.dev is enabled
  node ../scripts/fix-deployment-routes.cjs
  echo -e "${GREEN}✓ Updated wrangler.toml for workers.dev domain${NC}"
fi

cd ..

# Step 3: Check for GitHub Actions and secrets
echo -e "\n${BLUE}STEP 3: Checking GitHub Actions Configuration${NC}"

if [ -f ".github/workflows/deploy-all-final.yml" ]; then
  echo -e "${GREEN}✓ GitHub Actions workflow file exists${NC}"
  
  if [ -f "scripts/verify-github-secrets.sh" ] && command_exists gh; then
    echo -e "${YELLOW}Verifying GitHub secrets...${NC}"
    bash scripts/verify-github-secrets.sh
    
    if [ $? -ne 0 ] && [ -f "scripts/upload-missing-secrets.sh" ]; then
      echo -e "${YELLOW}Some GitHub secrets may be missing. Uploading missing secrets...${NC}"
      bash scripts/upload-missing-secrets.sh
    fi
  else
    echo -e "${YELLOW}⚠ GitHub CLI not installed or verify-github-secrets.sh not found${NC}"
    echo -e "${YELLOW}⚠ Cannot verify GitHub secrets automatically${NC}"
    echo -e "${YELLOW}⚠ If using GitHub Actions, ensure all secrets are configured in the repository settings${NC}"
  fi
else
  echo -e "${YELLOW}⚠ GitHub Actions workflow file not found${NC}"
  echo -e "${YELLOW}⚠ Will perform manual deployment${NC}"
fi

# Step 4: Deploy the Edge Worker
echo -e "\n${BLUE}STEP 4: Deploying Edge Worker${NC}"

cd edge-worker
echo -e "${YELLOW}Installing dependencies...${NC}"
bun install

echo -e "${YELLOW}Deploying edge worker...${NC}"
if confirm "Deploy the edge worker now?"; then
  npx wrangler deploy
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Edge worker deployed successfully${NC}"
  else
    echo -e "${RED}✗ Edge worker deployment failed${NC}"
    if confirm "Continue anyway?"; then
      echo -e "${YELLOW}Continuing despite deployment failure${NC}"
    else
      echo -e "${YELLOW}Exiting. Please fix the deployment issues and try again.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}Skipping edge worker deployment${NC}"
fi
cd ..

# Step 5: Deploy the Public Site
echo -e "\n${BLUE}STEP 5: Deploying Public Site${NC}"

cd 48Continental_Starter/public-site
echo -e "${YELLOW}Installing dependencies...${NC}"
bun install

echo -e "${YELLOW}Building public site...${NC}"
bun run build

echo -e "${YELLOW}Deploying public site...${NC}"
if confirm "Deploy the public site now?"; then
  npx wrangler pages deploy build
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Public site deployed successfully${NC}"
  else
    echo -e "${RED}✗ Public site deployment failed${NC}"
    if confirm "Continue anyway?"; then
      echo -e "${YELLOW}Continuing despite deployment failure${NC}"
    else
      echo -e "${YELLOW}Exiting. Please fix the deployment issues and try again.${NC}"
      exit 1
    fi
  fi
else
  echo -e "${YELLOW}Skipping public site deployment${NC}"
fi
cd ../..

# Step 6: Verify Deployment
echo -e "\n${BLUE}STEP 6: Verifying Deployment${NC}"

echo -e "${YELLOW}Running monitor-deployment.sh to check all components...${NC}"
bash scripts/monitor-deployment.sh

echo -e "${YELLOW}Checking API data...${NC}"
node scripts/check-api-data.cjs

# Step 7: Configure MCP Server (Optional)
echo -e "\n${BLUE}STEP 7: Configure MCP Server (Optional)${NC}"

if confirm "Do you want to configure the MCP server for persistent operation?"; then
  echo -e "${YELLOW}Setting up MCP server...${NC}"
  
  cd mcp-server
  echo -e "${YELLOW}Installing dependencies...${NC}"
  bun install
  
  echo -e "${YELLOW}Checking .env file...${NC}"
  if [ ! -f ".env" ] && [ -f ".env.example" ]; then
    echo -e "${YELLOW}Creating .env file from example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please edit the .env file with appropriate values${NC}"
    if command_exists nano; then
      nano .env
    elif command_exists vim; then
      vim .env
    else
      echo -e "${YELLOW}Please edit the .env file manually${NC}"
    fi
  fi
  
  echo -e "${YELLOW}Do you want to create a systemd service for persistent operation?${NC}"
  if confirm "This requires sudo access and will create a system service"; then
    read -p "Enter your username: " USERNAME
    USERNAME=${USERNAME:-$(whoami)}
    PROJECT_PATH=$(pwd)
    
    echo -e "${YELLOW}Creating systemd service file...${NC}"
    cat << EOF > /tmp/48continental-mcp.service
[Unit]
Description=48 Continental USA MCP Server
After=network.target

[Service]
User=${USERNAME}
WorkingDirectory=${PROJECT_PATH}
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=48continental-mcp

[Install]
WantedBy=multi-user.target
EOF
    
    echo -e "${YELLOW}Installing service file (requires sudo)...${NC}"
    sudo mv /tmp/48continental-mcp.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable 48continental-mcp
    
    echo -e "${YELLOW}Starting MCP server...${NC}"
    sudo systemctl start 48continental-mcp
    
    echo -e "${YELLOW}Checking MCP server status...${NC}"
    sudo systemctl status 48continental-mcp
  else
    echo -e "${YELLOW}Skipping systemd service creation${NC}"
    echo -e "${YELLOW}You can start the MCP server manually with:${NC}"
    echo -e "${YELLOW}  cd mcp-server && node src/index.js${NC}"
  fi
  
  cd ..
else
  echo -e "${YELLOW}Skipping MCP server configuration${NC}"
fi

# Final Checklist
echo -e "\n${BLUE}STEP 8: Final Checklist${NC}"

echo -e "${YELLOW}Please manually verify the following:${NC}"
echo -e "  [ ] Edge Worker is deployed and all API endpoints are working"
echo -e "  [ ] Public site is deployed and connecting to API correctly"
echo -e "  [ ] KV namespaces are populated with required data"
echo -e "  [ ] Vehicle data is being correctly pulled from Tessie API"
echo -e "  [ ] Trip data shows correct states visited and progress"
echo -e "  [ ] Weather data is displaying for current location"
echo -e "  [ ] MCP server is running persistently (if configured)"
echo -e "  [ ] Monitoring scripts are running and reporting all systems operational"

# Completion
echo -e "\n${BLUE}============================================================${NC}"
echo -e "${GREEN}                 DEPLOYMENT COMPLETE                      ${NC}"
echo -e "${BLUE}============================================================${NC}"

if [ "$USE_CUSTOM_DOMAIN" = true ]; then
  echo -e "${YELLOW}Your system is deployed with the custom domain:${NC}"
  echo -e "${GREEN}  API: https://${CUSTOM_DOMAIN}${NC}"
  echo -e "${GREEN}  Public Site: https://main.continentalusa-site.pages.dev${NC}"
else
  echo -e "${YELLOW}Your system is deployed with the workers.dev domain:${NC}"
  echo -e "${GREEN}  API: https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev${NC}"
  echo -e "${GREEN}  Public Site: https://main.continentalusa-site.pages.dev${NC}"
fi

echo -e "\n${YELLOW}For ongoing maintenance and updates, refer to:${NC}"
echo -e "${GREEN}  docs/context/FINAL_DEPLOYMENT_STEPS.md${NC}"
echo -e "${GREEN}  docs/DEPLOYMENT_TROUBLESHOOTING.md${NC}"

echo -e "\n${BLUE}============================================================${NC}"
