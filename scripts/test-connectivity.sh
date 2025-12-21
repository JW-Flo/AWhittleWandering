#!/bin/bash

# Comprehensive Connectivity and Functionality Test
# Tests all connections: API endpoints, database, external APIs, frontend-backend

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
# Use worker URL as primary since custom domain may not be configured
API_BASE_URL="${API_BASE_URL:-https://awhittlewandering-api.kd8jc7v8cd.workers.dev}"
FRONTEND_URL="${FRONTEND_URL:-https://awhittlewandering.com}"
WORKER_URL="${WORKER_URL:-https://awhittlewandering-api.kd8jc7v8cd.workers.dev}"
CUSTOM_DOMAIN="${CUSTOM_DOMAIN:-https://api.awhittlewandering.com}"

PASSED=0
FAILED=0
WARNINGS=0

log() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

log_section() {
    echo ""
    log "$BLUE" "============================================================"
    log "$BLUE" "$1"
    log "$BLUE" "============================================================"
    echo ""
}

test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    
    log "$CYAN" "Testing: $name"
    log "$CYAN" "  URL: $url"
    
    local start=$(date +%s)
    local response
    local status_code
    local curl_exit=0
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" --max-time 10 "$url" 2>&1) || curl_exit=$?
    else
        response=$(curl -s -w "\n%{http_code}" --max-time 10 -X "$method" "$url" 2>&1) || curl_exit=$?
    fi
    
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    local end=$(date +%s)
    local duration=$(( (end - start) * 1000 ))
    
    # Handle curl errors (status code 000 means connection failed)
    if [ "$curl_exit" -ne 0 ] || [ "$status_code" = "000" ] || [ -z "$status_code" ]; then
        log "$RED" "  ✗ $name - Connection failed (curl exit: $curl_exit)"
        ((FAILED++))
        return 1
    fi
    
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        log "$GREEN" "  ✓ $name - $status_code ($duration ms)"
        ((PASSED++))
        return 0
    elif [ "$status_code" -ge 300 ] && [ "$status_code" -lt 400 ]; then
        log "$YELLOW" "  ⚠ $name - $status_code (Redirect) ($duration ms)"
        ((WARNINGS++))
        return 0
    else
        log "$RED" "  ✗ $name - $status_code ($duration ms)"
        ((FAILED++))
        return 1
    fi
}

test_health() {
    log_section "1. Health Endpoint Tests"
    
    test_endpoint "Health Check (Worker)" "$WORKER_URL/api/v1/health"
    test_endpoint "Health Check (Legacy)" "$API_BASE_URL/health"
    
    # Test custom domain (may be propagating)
    log "$CYAN" "Testing: Health Check (Custom Domain)"
    log "$CYAN" "  URL: $CUSTOM_DOMAIN/api/v1/health"
    local response=$(curl -s -w "\n%{http_code}" --max-time 10 "$CUSTOM_DOMAIN/api/v1/health" 2>&1) || true
    local status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "200" ]; then
        log "$GREEN" "  ✓ Health Check (Custom Domain) - $status_code"
        ((PASSED++))
    elif [ "$status_code" = "000" ]; then
        log "$YELLOW" "  ⚠ Health Check (Custom Domain) - Not responding yet"
        log "$YELLOW" "     (Route configured but may be propagating - check DNS/SSL)"
        ((WARNINGS++))
    else
        log "$YELLOW" "  ⚠ Health Check (Custom Domain) - $status_code"
        log "$YELLOW" "     (Route configured but may need time to activate)"
        ((WARNINGS++))
    fi
}

test_api_endpoints() {
    log_section "2. API Endpoint Tests"
    
    test_endpoint "Unified Data" "$API_BASE_URL/api/v1/unified-data"
    test_endpoint "Trip Status" "$API_BASE_URL/api/v1/trip-status"
    test_endpoint "Config Endpoint" "$API_BASE_URL/api/v1/config"
    test_endpoint "Root Endpoint" "$API_BASE_URL/"
}

test_frontend() {
    log_section "3. Frontend Connectivity Tests"
    
    test_endpoint "Frontend Homepage" "$FRONTEND_URL"
}

test_database() {
    log_section "4. Database Connectivity Tests"
    
    log "$CYAN" "Checking database status via health endpoint..."
    local health_response=$(curl -s --max-time 10 "$API_BASE_URL/api/v1/health" 2>&1) || true
    
    if echo "$health_response" | grep -q "d1_database.*operational"; then
        log "$GREEN" "  ✓ D1 Database: Operational"
        ((PASSED++))
    elif echo "$health_response" | grep -q "d1_database"; then
        local db_status=$(echo "$health_response" | grep -o '"d1_database":"[^"]*"' | cut -d'"' -f4)
        log "$YELLOW" "  ⚠ D1 Database: $db_status"
        ((WARNINGS++))
    else
        log "$YELLOW" "  ⚠ D1 Database: Status unknown"
        ((WARNINGS++))
    fi
    
    if echo "$health_response" | grep -q "r2_storage.*operational"; then
        log "$GREEN" "  ✓ R2 Storage: Operational"
        ((PASSED++))
    elif echo "$health_response" | grep -q "r2_storage"; then
        local r2_status=$(echo "$health_response" | grep -o '"r2_storage":"[^"]*"' | cut -d'"' -f4)
        log "$YELLOW" "  ⚠ R2 Storage: $r2_status"
        ((WARNINGS++))
    else
        log "$YELLOW" "  ⚠ R2 Storage: Status unknown"
        ((WARNINGS++))
    fi
}

test_external_apis() {
    log_section "5. External API Integration Tests"
    
    log "$CYAN" "Checking Tessie API connection via unified-data..."
    local unified_response=$(curl -s --max-time 10 "$API_BASE_URL/api/v1/unified-data" 2>&1) || true
    
    if echo "$unified_response" | grep -q '"connected":true'; then
        log "$GREEN" "  ✓ Tessie API: Connected"
        ((PASSED++))
    elif echo "$unified_response" | grep -q '"connected":false'; then
        log "$YELLOW" "  ⚠ Tessie API: Not connected"
        ((WARNINGS++))
    else
        log "$YELLOW" "  ⚠ Tessie API: Status unknown"
        ((WARNINGS++))
    fi
}

test_cors() {
    log_section "6. CORS Configuration Tests"
    
    log "$CYAN" "Testing CORS headers..."
    local cors_headers=$(curl -s -I --max-time 10 -H "Origin: $FRONTEND_URL" "$API_BASE_URL/api/v1/health" 2>&1) || true
    
    if echo "$cors_headers" | grep -qi "access-control-allow-origin"; then
        local origin=$(echo "$cors_headers" | grep -i "access-control-allow-origin" | cut -d':' -f2 | tr -d ' ')
        log "$GREEN" "  ✓ CORS configured: $origin"
        ((PASSED++))
    else
        log "$YELLOW" "  ⚠ CORS headers not found"
        ((WARNINGS++))
    fi
}

test_security_headers() {
    log_section "7. Security Headers Tests"
    
    log "$CYAN" "Checking security headers..."
    local headers=$(curl -s -I --max-time 10 "$API_BASE_URL/api/v1/health" 2>&1) || true
    
    local security_count=0
    if echo "$headers" | grep -qi "x-content-type-options"; then ((security_count++)); fi
    if echo "$headers" | grep -qi "x-frame-options"; then ((security_count++)); fi
    if echo "$headers" | grep -qi "x-xss-protection"; then ((security_count++)); fi
    if echo "$headers" | grep -qi "referrer-policy"; then ((security_count++)); fi
    
    if [ "$security_count" -ge 3 ]; then
        log "$GREEN" "  ✓ Security headers present: $security_count/4"
        ((PASSED++))
    else
        log "$YELLOW" "  ⚠ Some security headers missing: $security_count/4"
        ((WARNINGS++))
    fi
}

test_performance() {
    log_section "8. Performance Tests"
    
    local endpoints=("$API_BASE_URL/api/v1/health" "$API_BASE_URL/api/v1/unified-data" "$API_BASE_URL/api/v1/config")
    local names=("Health" "Unified Data" "Config")
    
    for i in "${!endpoints[@]}"; do
        local endpoint="${endpoints[$i]}"
        local name="${names[$i]}"
        local times=()
        
        log "$CYAN" "Testing $name response time..."
        
        for j in {1..3}; do
            local start=$(date +%s)
            curl -s --max-time 10 "$endpoint" > /dev/null 2>&1 || true
            local end=$(date +%s)
            local duration=$(( (end - start) * 1000 ))
            times+=($duration)
        done
        
        local sum=0
        for time in "${times[@]}"; do
            sum=$((sum + time))
        done
        local avg=$((sum / ${#times[@]}))
        local min=${times[0]}
        local max=${times[0]}
        for time in "${times[@]}"; do
            if [ "$time" -lt "$min" ]; then min=$time; fi
            if [ "$time" -gt "$max" ]; then max=$time; fi
        done
        
        if [ "$avg" -lt 500 ]; then
            log "$GREEN" "  ✓ $name: ${avg}ms avg (${min}-${max}ms)"
            ((PASSED++))
        elif [ "$avg" -lt 1000 ]; then
            log "$YELLOW" "  ⚠ $name: ${avg}ms avg (${min}-${max}ms) - Slow"
            ((WARNINGS++))
        else
            log "$RED" "  ✗ $name: ${avg}ms avg (${min}-${max}ms) - Very Slow"
            ((FAILED++))
        fi
    done
}

print_summary() {
    log_section "Test Summary"
    
    log "$GREEN" "Passed: $PASSED"
    log "$YELLOW" "Warnings: $WARNINGS"
    log "$RED" "Failed: $FAILED"
    
    local total=$((PASSED + FAILED))
    if [ "$total" -gt 0 ]; then
        # Calculate success rate without bc (bash arithmetic)
        local success_rate=$((PASSED * 1000 / total))
        local whole=$((success_rate / 10))
        local decimal=$((success_rate % 10))
        log "$CYAN" "Success Rate: ${whole}.${decimal}%"
    fi
    
    echo ""
    
    if [ "$FAILED" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
        log "$GREEN" "✓ All tests passed!"
        exit 0
    elif [ "$FAILED" -eq 0 ]; then
        log "$YELLOW" "⚠ Tests passed with warnings"
        exit 0
    else
        log "$RED" "✗ Some tests failed"
        exit 1
    fi
}

main() {
    log "$CYAN" "
╔════════════════════════════════════════════════════════════╗
║   A Whittle Wandering - Connectivity & Functionality Test  ║
╚════════════════════════════════════════════════════════════╝
"
    
    echo ""
    log "$CYAN" "Testing endpoints:"
    log "$CYAN" "  API Base: $API_BASE_URL"
    log "$CYAN" "  Frontend: $FRONTEND_URL"
    log "$CYAN" "  Worker: $WORKER_URL"
    echo ""
    
    test_health
    test_api_endpoints
    test_frontend
    test_database
    test_external_apis
    test_cors
    test_security_headers
    test_performance
    
    print_summary
}

main

