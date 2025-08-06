#!/bin/bash

# Recursive QA Monitor
# Continuously monitors the application and triggers QA when issues are detected

set -e

PROJECT_ROOT="/Users/joe/Projects/Personal/ContinentalUSA"
QA_DIR="$PROJECT_ROOT/qa"
MONITOR_LOG="$QA_DIR/logs/monitor-$(date +%Y%m%d).log"

# Configuration
CHECK_INTERVAL=300  # 5 minutes
ERROR_THRESHOLD=5   # Consecutive errors before triggering QA
API_TIMEOUT=10      # API timeout in seconds

# Service URLs
BACKEND_URL="https://awhittlewandering-api.kd8jc7v8cd.workers.dev"
FRONTEND_URL="https://ab99ceea.awhittlewandering-frontend.pages.dev"

# Counters
CONSECUTIVE_ERRORS=0
TOTAL_CHECKS=0
TOTAL_ERRORS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$MONITOR_LOG"
}

# Health check function
check_service_health() {
    local service_name="$1"
    local url="$2"
    local endpoint="$3"
    
    local full_url="$url$endpoint"
    
    if curl -s --max-time "$API_TIMEOUT" --fail "$full_url" > /dev/null 2>&1; then
        return 0  # Success
    else
        return 1  # Failure
    fi
}

# Comprehensive health check
run_health_checks() {
    local checks_passed=0
    local total_checks=4
    
    log "🔍 Running comprehensive health checks..."
    
    # Backend health check
    if check_service_health "Backend" "$BACKEND_URL" "/health"; then
        log "✅ Backend health: OK"
        ((checks_passed++))
    else
        log "❌ Backend health: FAILED"
    fi
    
    # Backend API data check
    if check_service_health "Backend API" "$BACKEND_URL" "/api/tesla-data"; then
        log "✅ Backend API: OK"
        ((checks_passed++))
    else
        log "❌ Backend API: FAILED"
    fi
    
    # Frontend availability check
    if check_service_health "Frontend" "$FRONTEND_URL" ""; then
        log "✅ Frontend: OK"
        ((checks_passed++))
    else
        log "❌ Frontend: FAILED"
    fi
    
    # API response validation
    local api_response=$(curl -s --max-time "$API_TIMEOUT" "$BACKEND_URL/api/tesla-data" 2>/dev/null)
    if echo "$api_response" | jq -e '.battery_level' > /dev/null 2>&1; then
        log "✅ API Response Structure: OK"
        ((checks_passed++))
    else
        log "❌ API Response Structure: FAILED"
    fi
    
    # Calculate health percentage
    local health_percentage=$((checks_passed * 100 / total_checks))
    log "📊 Overall Health: $health_percentage% ($checks_passed/$total_checks)"
    
    if [[ $checks_passed -eq $total_checks ]]; then
        return 0  # All checks passed
    else
        return 1  # Some checks failed
    fi
}

# Performance monitoring
check_performance() {
    log "⚡ Checking performance metrics..."
    
    # Measure backend response time
    local backend_start=$(date +%s%N)
    if curl -s --max-time "$API_TIMEOUT" "$BACKEND_URL/health" > /dev/null; then
        local backend_end=$(date +%s%N)
        local backend_response_time=$(( (backend_end - backend_start) / 1000000 )) # Convert to milliseconds
        
        log "📊 Backend response time: ${backend_response_time}ms"
        
        if [[ $backend_response_time -gt 5000 ]]; then
            log "⚠️ Backend response time is slow (>${backend_response_time}ms)"
            return 1
        fi
    else
        log "❌ Backend performance check failed"
        return 1
    fi
    
    # Measure frontend loading time
    local frontend_start=$(date +%s%N)
    if curl -s --max-time "$API_TIMEOUT" "$FRONTEND_URL" > /dev/null; then
        local frontend_end=$(date +%s%N)
        local frontend_response_time=$(( (frontend_end - frontend_start) / 1000000 ))
        
        log "📊 Frontend response time: ${frontend_response_time}ms"
        
        if [[ $frontend_response_time -gt 10000 ]]; then
            log "⚠️ Frontend response time is slow (>${frontend_response_time}ms)"
            return 1
        fi
    else
        log "❌ Frontend performance check failed"
        return 1
    fi
    
    return 0
}

# Error pattern detection
detect_error_patterns() {
    log "🔍 Scanning logs for error patterns..."
    
    local recent_logs="$QA_DIR/logs"
    local error_patterns=(
        "500 Internal Server Error"
        "Connection refused"
        "timeout"
        "rate limit exceeded"
        "authentication failed"
        "database connection"
        "memory leak"
        "uncaught exception"
    )
    
    local errors_found=0
    
    if [[ -d "$recent_logs" ]]; then
        for pattern in "${error_patterns[@]}"; do
            local matches=$(find "$recent_logs" -name "*.log" -mtime -1 -exec grep -i "$pattern" {} \; 2>/dev/null | wc -l)
            if [[ $matches -gt 0 ]]; then
                log "⚠️ Found $matches instances of '$pattern' in recent logs"
                ((errors_found++))
            fi
        done
    fi
    
    if [[ $errors_found -gt 0 ]]; then
        log "❌ Error patterns detected: $errors_found"
        return 1
    else
        log "✅ No concerning error patterns found"
        return 0
    fi
}

# Trigger recursive QA
trigger_recursive_qa() {
    log "🚨 Triggering recursive QA due to detected issues..."
    
    # Create alert file
    local alert_file="$QA_DIR/alerts/alert-$(date +%Y%m%d-%H%M%S).json"
    mkdir -p "$(dirname "$alert_file")"
    
    cat > "$alert_file" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "trigger": "monitoring",
    "consecutive_errors": $CONSECUTIVE_ERRORS,
    "total_errors": $TOTAL_ERRORS,
    "total_checks": $TOTAL_CHECKS,
    "error_rate": $(echo "scale=2; $TOTAL_ERRORS * 100 / $TOTAL_CHECKS" | bc -l),
    "services": {
        "backend": "$BACKEND_URL",
        "frontend": "$FRONTEND_URL"
    }
}
EOF
    
    # Run the full QA pipeline
    log "🧪 Executing recursive QA pipeline..."
    
    if cd "$QA_DIR" && node recursive-qa-pipeline.js 3; then
        log "✅ Recursive QA completed successfully"
        CONSECUTIVE_ERRORS=0  # Reset error counter
        return 0
    else
        log "❌ Recursive QA failed"
        
        # Send alert notification
        send_alert_notification "Recursive QA failed after monitoring detected issues"
        return 1
    fi
}

# Send notifications
send_alert_notification() {
    local message="$1"
    
    log "📢 Sending alert notification: $message"
    
    # Slack webhook (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Tesla App Alert: $message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || true
    fi
    
    # Email notification (if configured)
    if [[ -n "${ALERT_EMAIL:-}" ]] && command -v mail > /dev/null; then
        echo "$message" | mail -s "Tesla App Alert" "$ALERT_EMAIL" || true
    fi
    
    # Log alert
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERT: $message" >> "$QA_DIR/logs/alerts.log"
}

# Main monitoring loop
main_monitor_loop() {
    log "🚀 Starting continuous monitoring (interval: ${CHECK_INTERVAL}s)"
    
    while true; do
        ((TOTAL_CHECKS++))
        
        local check_start=$(date '+%Y-%m-%d %H:%M:%S')
        log "🔄 Check #$TOTAL_CHECKS started at $check_start"
        
        # Run all checks
        local health_ok=true
        local performance_ok=true
        local patterns_ok=true
        
        if ! run_health_checks; then
            health_ok=false
        fi
        
        if ! check_performance; then
            performance_ok=false
        fi
        
        if ! detect_error_patterns; then
            patterns_ok=false
        fi
        
        # Evaluate results
        if [[ "$health_ok" == true && "$performance_ok" == true && "$patterns_ok" == true ]]; then
            log "✅ All checks passed"
            CONSECUTIVE_ERRORS=0
        else
            log "❌ Some checks failed"
            ((CONSECUTIVE_ERRORS++))
            ((TOTAL_ERRORS++))
            
            log "⚠️ Consecutive errors: $CONSECUTIVE_ERRORS/$ERROR_THRESHOLD"
            
            # Trigger QA if threshold reached
            if [[ $CONSECUTIVE_ERRORS -ge $ERROR_THRESHOLD ]]; then
                log "🚨 Error threshold reached, triggering recursive QA..."
                
                if trigger_recursive_qa; then
                    log "✅ Issue resolution completed"
                else
                    log "❌ Issue resolution failed"
                    
                    # Wait longer before next check if QA fails
                    log "😴 Extended wait due to QA failure..."
                    sleep $((CHECK_INTERVAL * 2))
                fi
            fi
        fi
        
        # Status summary
        local error_rate=0
        if [[ $TOTAL_CHECKS -gt 0 ]]; then
            error_rate=$(echo "scale=2; $TOTAL_ERRORS * 100 / $TOTAL_CHECKS" | bc -l 2>/dev/null || echo "0")
        fi
        
        log "📊 Session Stats - Checks: $TOTAL_CHECKS, Errors: $TOTAL_ERRORS, Rate: ${error_rate}%, Consecutive: $CONSECUTIVE_ERRORS"
        
        # Wait for next check
        log "😴 Waiting ${CHECK_INTERVAL}s until next check..."
        sleep "$CHECK_INTERVAL"
    done
}

# Signal handlers
cleanup() {
    log "🛑 Monitor stopped"
    exit 0
}

# Trap signals
trap cleanup INT TERM

# Create necessary directories
mkdir -p "$QA_DIR/logs" "$QA_DIR/alerts"

# Start monitoring
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main_monitor_loop
fi
