#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd "$(dirname "$0")/.."

echo -e "${BLUE}Validating security configurations...${NC}"

# Load security config
if [[ ! -f "config/security.json" ]]; then
    echo -e "${RED}Error: security.json not found${NC}"
    exit 1
fi

# Apply security settings to n8n
echo -e "${BLUE}Applying security settings...${NC}"
response=$(curl -s -X POST "http://localhost:5679/rest/security/update" \
    -H "Content-Type: application/json" \
    -d @config/security.json)

if [[ $response == *"success"* ]]; then
    echo -e "${GREEN}✓ Security settings applied${NC}"
else
    echo -e "${RED}✗ Failed to apply security settings${NC}"
    echo "Response: $response"
fi

# Check webhook security
echo -e "\n${BLUE}Checking webhook security...${NC}"
curl -s -X POST "http://localhost:5679/rest/security/webhooks/validate" \
    -H "Content-Type: application/json"

# Verify CORS settings
echo -e "\n${BLUE}Verifying CORS configuration...${NC}"
curl -s -X GET "http://localhost:5679/rest/security/cors" \
    -H "Content-Type: application/json"

# Enable rate limiting
echo -e "\n${BLUE}Configuring rate limiting...${NC}"
curl -s -X POST "http://localhost:5679/rest/security/rate-limiting" \
    -H "Content-Type: application/json" \
    -d '{
        "enabled": true,
        "max": 100,
        "timeWindow": 60000,
        "whitelist": ["127.0.0.1"]
    }'

# Enable MCP authentication
echo -e "\n${BLUE}Setting up MCP authentication...${NC}"
curl -s -X POST "http://localhost:5679/rest/security/mcp" \
    -H "Content-Type: application/json" \
    -d '{
        "enabled": true,
        "authToken": "'"${MCP_AUTH_TOKEN}"'",
        "allowedOrigins": ["http://localhost:4000"]
    }'

# Validate credentials
echo -e "\n${BLUE}Validating credentials...${NC}"
response=$(curl -s -X POST "http://localhost:5679/rest/credentials/test" \
    -H "Content-Type: application/json")

if [[ $response == *"valid"* ]]; then
    echo -e "${GREEN}✓ All credentials are valid${NC}"
else
    echo -e "${RED}✗ Some credentials failed validation${NC}"
    echo "Response: $response"
fi

echo -e "\n${GREEN}Security validation complete!${NC}"
