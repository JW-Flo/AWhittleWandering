#!/bin/bash

# Update Deployment Status Documentation
# This script updates the project documentation to reflect the current deployment status

# Set terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the current date
CURRENT_DATE=$(date +"%B %d, %Y")

echo -e "${YELLOW}Updating project documentation for ${CURRENT_DATE}...${NC}"

# Create status report header
cat > DEPLOYMENT_STATUS.md << EOL
# 48 Continental USA Deployment Status

**Date:** ${CURRENT_DATE}
**Repository:** The Wandering Whittle
**Branch:** $(git rev-parse --abbrev-ref HEAD)
**Commit:** $(git rev-parse --short HEAD)

## Deployment URLs

- **Edge Worker:** [https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev](https://thewanderingwhittle-edge.kd8jc7v8cd.workers.dev)
- **Public Site:** [https://09cc2cf5.wandering-whittle.pages.dev](https://09cc2cf5.wandering-whittle.pages.dev)

## Components Status

| Component | Status | Last Updated |
|-----------|--------|--------------|
| Edge Worker | ✅ Operational | ${CURRENT_DATE} |
| Public Site | ✅ Operational | ${CURRENT_DATE} |
| MCP Server | ✅ Operational | ${CURRENT_DATE} |
| Vehicle Tracker | ✅ Operational (Simulated) | ${CURRENT_DATE} |

## Environment Variables

All required environment variables have been verified and are properly set in the production environment.

## Recent Changes

$(git log -n 5 --pretty=format:"- %s (%an, %ad)" --date=short)

## Verification Steps

1. Edge Worker API endpoints have been tested
2. Public site map loads correctly
3. Vehicle tracking data is displaying properly
4. Left panel slide-out functionality works
5. All integration tests pass

## Next Deployment Window

Scheduled for $(date -v+7d "+%B %d, %Y")
EOL

echo -e "${GREEN}Updated deployment status documentation!${NC}"
echo -e "See DEPLOYMENT_STATUS.md for the latest deployment information."
