#!/bin/bash

# Continuous Deployment QA Hook
# This script runs automatically on deployments and triggers recursive QA

set -e

#!/bin/bash

# 📊 Continuous Deployment QA Pipeline
# Automated testing and monitoring for production deployments

set -e

# Get project root dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
QA_DIR="$PROJECT_ROOT/qa"
LOG_FILE="$QA_DIR/logs/cd-qa-$(date +%Y%m%d-%H%M%S).log"
WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}  # Optional Slack webhook for notifications
MAX_ITERATIONS=5
FAILURE_THRESHOLD=3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Notification function
notify() {
    local message="$1"
    local status="$2"
    
    log "$message"
    
    if [[ -n "$WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Tesla App QA: $message\"}" \
            "$WEBHOOK_URL" 2>/dev/null || true
    fi
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check git status
    if ! git diff --quiet HEAD; then
        log "⚠️ Warning: Uncommitted changes detected"
        git status --porcelain | tee -a "$LOG_FILE"
    fi
    
    # Check if we're on the right branch
    current_branch=$(git branch --show-current)
    if [[ "$current_branch" != "main" ]]; then
        log "⚠️ Warning: Not on main branch (current: $current_branch)"
    fi
    
    # Check if dependencies are up to date
    if [[ ! -d "$PROJECT_ROOT/frontend/node_modules" ]]; then
        log "📦 Installing frontend dependencies..."
        cd "$PROJECT_ROOT/frontend" && npm install
    fi
    
    if [[ ! -d "$PROJECT_ROOT/backend/edge-worker/node_modules" ]]; then
        log "📦 Installing backend dependencies..."
        cd "$PROJECT_ROOT/backend/edge-worker" && npm install
    fi
    
    log "✅ Pre-deployment checks completed"
}

# Build and deploy
build_and_deploy() {
    log "🏗️ Building and deploying applications..."
    
    cd "$PROJECT_ROOT"
    
    # Build frontend
    log "Building frontend..."
    cd frontend
    if ! npm run build; then
        log "❌ Frontend build failed"
        return 1
    fi
    
    # Deploy frontend
    log "Deploying frontend..."
    if ! npx wrangler pages deploy dist --project-name="awhittlewandering"; then
        log "❌ Frontend deployment failed"
        return 1
    fi
    
    # Deploy backend
    log "Deploying backend..."
    cd ../backend/edge-worker
    if ! npx wrangler deploy; then
        log "❌ Backend deployment failed"
        return 1
    fi
    
    log "✅ Deployment completed successfully"
    return 0
}

# Run QA pipeline with recursive capability
run_recursive_qa() {
    local iteration=${1:-1}
    local max_iterations=${2:-$MAX_ITERATIONS}
    
    log "🧪 Starting QA Pipeline - Iteration $iteration/$max_iterations"
    
    cd "$QA_DIR"
    
    # Run the recursive QA pipeline
    if node recursive-qa-pipeline.js "$max_iterations"; then
        log "✅ QA Pipeline passed on iteration $iteration"
        return 0
    else
        log "❌ QA Pipeline failed on iteration $iteration"
        
        # If we haven't reached max iterations, try again after brief fixes
        if [[ $iteration -lt $max_iterations ]]; then
            log "🔄 Attempting automatic remediation..."
            
            # Run automatic fixes
            if run_automatic_fixes; then
                log "🔧 Automatic fixes applied, retrying QA..."
                # Redeploy with fixes
                if build_and_deploy; then
                    # Recursively run QA again
                    run_recursive_qa $((iteration + 1)) "$max_iterations"
                else
                    log "❌ Redeploy failed after fixes"
                    return 1
                fi
            else
                log "❌ Automatic fixes failed"
                return 1
            fi
        else
            log "❌ Maximum QA iterations reached"
            return 1
        fi
    fi
}

# Automatic fixes for common issues
run_automatic_fixes() {
    log "🔧 Running automatic fixes..."
    
    cd "$PROJECT_ROOT"
    
    # Fix 1: Clear build caches
    log "Clearing build caches..."
    rm -rf frontend/dist frontend/.vite backend/edge-worker/dist
    
    # Fix 2: Reinstall dependencies if packages changed
    if git diff --name-only HEAD~1 | grep -E "(package\.json|package-lock\.json)"; then
        log "Package files changed, reinstalling dependencies..."
        cd frontend && npm ci
        cd ../backend/edge-worker && npm ci
        cd "$PROJECT_ROOT"
    fi
    
    # Fix 3: Restart development servers if running
    if pgrep -f "vite"; then
        log "Restarting Vite dev server..."
        pkill -f "vite"
        sleep 2
    fi
    
    # Fix 4: Check for common code issues
    log "Running ESLint fixes..."
    cd frontend
    npm run lint:fix 2>/dev/null || true
    
    # Fix 5: Update API keys if they're expired (placeholder)
    # This would check external service status and refresh tokens
    check_external_services
    
    log "✅ Automatic fixes completed"
    return 0
}

# Check external service health
check_external_services() {
    log "🌐 Checking external services..."
    
    # Check Tessie API
    if ! curl -s --fail "https://api.tessie.com/health" > /dev/null; then
        log "⚠️ Tessie API health check failed"
    fi
    
    # Check Cloudflare status
    if ! curl -s --fail "https://www.cloudflarestatus.com/api/v2/status.json" > /dev/null; then
        log "⚠️ Cloudflare status check failed"
    fi
    
    # Check Mapbox status
    if ! curl -s --fail "https://status.mapbox.com/api/v2/status.json" > /dev/null; then
        log "⚠️ Mapbox status check failed"
    fi
    
    log "✅ External services check completed"
}

# Post-deployment validation
post_deployment_validation() {
    log "🔍 Running post-deployment validation..."
    
    # Wait for deployments to propagate
    log "Waiting for deployment propagation..."
    sleep 30
    
    # Quick health checks (override via env for repeatable runs)
    local backend_url="${QA_API_BASE_URL:-https://awhittlewandering-api.kd8jc7v8cd.workers.dev}"
    local frontend_url="${QA_FRONTEND_URL:-https://awhittlewandering.pages.dev}"
    
    # Backend health check
    if curl -s --fail "$backend_url/api/v1/health" > /dev/null; then
        log "✅ Backend health check passed"
    else
        log "❌ Backend health check failed"
        return 1
    fi
    
    # Frontend health check
    if curl -s --fail "$frontend_url" > /dev/null; then
        log "✅ Frontend health check passed"
    else
        log "❌ Frontend health check failed"
        return 1
    fi
    
    # API data validation (structure only)
    if curl -s --fail "$backend_url/api/v1/unified-data" | jq -e '.overview and .currentStatus and .currentStatus.battery and (.currentStatus.battery.level|type=="number")' > /dev/null; then
        log "✅ API data validation passed"
    else
        log "❌ API data validation failed"
        return 1
    fi
    
    log "✅ Post-deployment validation completed"
    return 0
}

# Performance monitoring
monitor_performance() {
    log "📊 Running performance monitoring..."
    
    cd "$QA_DIR"
    
    # Run performance tests
    node -e "
    import('./tests/e2e.test.js').then(module => {
        return module.e2eTestUtils.measurePerformance();
    }).then(metrics => {
        console.log('Performance Metrics:', JSON.stringify(metrics, null, 2));
        
        // Alert on poor performance
        if (metrics.loadTime > 10000) {
            console.log('⚠️ Performance Alert: Slow load time detected');
        }
    }).catch(err => {
        console.error('Performance monitoring failed:', err.message);
    });
    "
    
    log "✅ Performance monitoring completed"
}

# Generate deployment report
generate_report() {
    local status="$1"
    local report_file="$QA_DIR/reports/deployment-report-$(date +%Y%m%d-%H%M%S).json"
    
    cat > "$report_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "deployment": {
    "status": "$status",
    "branch": "$(git branch --show-current)",
    "commit": "$(git rev-parse HEAD)",
    "author": "$(git log -1 --pretty=format:'%an <%ae>')"
  },
  "qa": {
    "logFile": "$LOG_FILE",
    "iterations": "$FAILURE_THRESHOLD"
  },
  "services": {
    "backend": "https://awhittlewandering-api.kd8jc7v8cd.workers.dev",
    "frontend": "https://ab99ceea.awhittlewandering-frontend.pages.dev"
  },
  "nextActions": [
    $(if [[ "$status" == "success" ]]; then
        echo '"Monitor production metrics",'
        echo '"Schedule next QA run"'
    else
        echo '"Investigate failure logs",'
        echo '"Apply manual fixes",'
        echo '"Retry deployment"'
    fi)
  ]
}
EOF
    
    log "📋 Deployment report generated: $report_file"
    
    # Display summary
    echo -e "\n${BLUE}=== DEPLOYMENT SUMMARY ===${NC}"
    echo -e "Status: $(if [[ "$status" == "success" ]]; then echo -e "${GREEN}SUCCESS${NC}"; else echo -e "${RED}FAILED${NC}"; fi)"
    echo -e "Branch: $(git branch --show-current)"
    echo -e "Commit: $(git rev-parse --short HEAD)"
    echo -e "Log: $LOG_FILE"
    echo -e "Report: $report_file"
    echo -e "${BLUE}========================${NC}\n"
}

# Main execution
main() {
    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"
    
    log "🚀 Starting Continuous Deployment QA Process"
    notify "Starting CD QA Process" "info"
    
    # Trap to ensure cleanup
    trap 'log "🛑 Process interrupted"; exit 1' INT TERM
    
    # Run the pipeline
    if pre_deployment_checks && \
       build_and_deploy && \
       post_deployment_validation && \
       run_recursive_qa 1 "$MAX_ITERATIONS" && \
       monitor_performance; then
        
        log "🎉 Continuous Deployment QA completed successfully!"
        notify "CD QA Process completed successfully!" "success"
        generate_report "success"
        exit 0
    else
        log "💥 Continuous Deployment QA failed!"
        notify "CD QA Process failed!" "error"
        generate_report "failed"
        exit 1
    fi
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
