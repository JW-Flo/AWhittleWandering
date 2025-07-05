#!/usr/bin/env bash
set -Eeuo pipefail

# Full Local CI → Cloudflare Staging Deploy
# 
# This script implements the complete workflow:
# 1. Build and start the entire MCP stack in the background
# 2. Run all unit tests using the test-runner MCP; fail fast on any errors
# 3. Compile the production front-end build (Vite) for confirmation
# 4. Trigger a staging deployment of the Workers site via the deployment MCP
# 5. Verify the staging URL responds with HTTP 200

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}❌${NC} $1"
}

# Cleanup function
cleanup() {
    log_info "Cleaning up containers..."
    docker compose -f configs/docker-compose.yml down -v >/dev/null 2>&1 || true
}

# Trap cleanup on exit
trap cleanup ERR EXIT

# Change to project root
cd "$(dirname "$0")/.."

log_info "Starting Full Local CI → Cloudflare Staging Deploy"

## 0. Pre-flight checks
log_info "Running pre-flight checks..."

# Check required environment variables
REQUIRED_VARS=(WRANGLER_API_TOKEN CLOUDFLARE_ACCOUNT_ID)
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        log_error "Missing required environment variable: $var"
        log_error "Please check your .env file"
        exit 1
    fi
done

# Check Docker is running
if ! docker info >/dev/null 2>&1; then
    log_error "Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check ports 9011-9015 are free
for port in {9011..9015}; do
    if lsof -i :"$port" >/dev/null 2>&1; then
        log_error "Port $port is busy. Please free up ports 9011-9015."
        exit 1
    fi
done

log_success "Pre-flight checks passed"

## 1. Spin up containers (detached)
log_info "Building and starting MCP stack containers..."
docker compose -f configs/docker-compose.yml up -d --build

## 2. Wait for health-checks (30 s max)
log_info "Waiting for services to become healthy..."
deadline=$((SECONDS + 30))

for port in 9012 9013 9014 9015; do
    log_info "Checking health of service on port $port..."
    while ! curl -fs "http://localhost:$port/health" >/dev/null 2>&1; do
        if [[ $SECONDS -gt $deadline ]]; then
            log_error "Health check timeout on port $port"
            docker compose -f configs/docker-compose.yml logs
            exit 1
        fi
        sleep 2
    done
done

log_success "All services are healthy"

## 3. Run unit tests via MCP
log_info "Running unit tests via test-runner MCP..."
test_response=$(curl -s -X POST http://localhost:9015/run_unit || echo '{"status":"error","error":"curl_failed"}')
test_status=$(echo "$test_response" | jq -r '.status' 2>/dev/null || echo "error")

if [[ "$test_status" != "success" ]]; then
    log_error "Unit tests failed"
    echo "$test_response" | jq '.' 2>/dev/null || echo "$test_response"
    exit 1
fi

log_success "Unit tests passed"

## 4. Build front-end production bundle
log_info "Building front-end production bundle..."
pushd awhittlewandering >/dev/null

# Install dependencies
if command -v bun >/dev/null 2>&1; then
    log_info "Using bun for dependency installation..."
    bun install --frozen-lockfile
    bun run build:frontend
else
    log_info "Using npm for dependency installation..."
    npm ci
    npm run build:frontend
fi

popd >/dev/null
log_success "Front-end build completed"

## 5. Trigger staging deploy via deployment MCP
log_info "Triggering staging deployment via MCP..."
deploy_response=$(curl -s -X POST -H 'Content-Type: application/json' \
    -d '{"env":"staging"}' http://localhost:9014/wranglerDeploy || echo '{"status":"error","error":"curl_failed"}')
deploy_status=$(echo "$deploy_response" | jq -r '.status' 2>/dev/null || echo "error")

if [[ "$deploy_status" != "success" ]]; then
    log_error "Deployment failed"
    echo "$deploy_response" | jq '.' 2>/dev/null || echo "$deploy_response"
    exit 1
fi

log_success "Staging deployment completed"

## 6. Smoke-test staging URL
STAGING_URL="https://staging.awhittlewandering.com"
log_info "Verifying staging URL: $STAGING_URL"

# Wait up to 2 minutes for staging to become available
deadline=$((SECONDS + 120))
while ! curl -Is "$STAGING_URL" 2>/dev/null | grep -q "200 OK"; do
    if [[ $SECONDS -gt $deadline ]]; then
        log_error "Staging URL did not become healthy within 2 minutes"
        exit 1
    fi
    log_info "Waiting for staging URL to respond..."
    sleep 5
done

log_success "Staging site is live and responding"

## 7. Post-deployment checks
log_info "Running post-deployment checks..."

# Check container health
unhealthy_containers=$(docker compose -f configs/docker-compose.yml ps --format '{{.Name}}: {{.Status}}' | grep -v healthy || true)
if [[ -n "$unhealthy_containers" ]]; then
    log_warning "Some containers are not healthy:"
    echo "$unhealthy_containers"
else
    log_success "All containers remain healthy"
fi

# Test API endpoints
log_info "Testing API endpoints..."
api_health=$(curl -s "$STAGING_URL/health" | jq -r '.status' 2>/dev/null || echo "error")
if [[ "$api_health" == "ok" ]]; then
    log_success "API health check passed"
else
    log_warning "API health check failed"
fi

## 8. Summary
log_success "🎉 Full local CI → Cloudflare staging deploy completed successfully!"
echo
echo "Summary:"
echo "  ✅ MCP stack: Running and healthy"
echo "  ✅ Unit tests: Passed"
echo "  ✅ Front-end build: Completed"
echo "  ✅ Staging deploy: Success"
echo "  ✅ URL verification: $STAGING_URL"
echo
echo "Next steps:"
echo "  • Review the staging deployment"
echo "  • Run integration tests if needed"
echo "  • Deploy to production: change 'staging' to 'production' in step 5"

# Don't run cleanup on success - leave containers running for development
trap - EXIT
