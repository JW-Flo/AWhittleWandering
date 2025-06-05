#!/bin/bash

# Script to run tests with real data and capture failures
set -e

echo "🚀 Running tests with real data..."

# Set environment to use real data
export NODE_ENV=test
export USE_REAL_DATA=true

# Create test results directory
mkdir -p test-results

# Run tests and capture output
echo "📊 Executing test suite..."
npm test -- --reporter=json --run > test-results.json 2>&1 || {
    echo "⚠️  Tests completed with failures"
    
    # Analyze the failures
    echo "🔍 Analyzing test failures..."
    node scripts/test-analyzer.js
    
    # Create a failure summary for the repo
    echo "📝 Creating failure summary..."
    cat > test-results/LATEST_FAILURES.md << EOF
# Test Failure Report

**Generated:** $(date)

## Summary
$(cat test-results/latest-summary.txt)

## Next Steps
1. Review the failed tests in the test-results directory
2. Fix the underlying issues with real data integration
3. Re-run tests to verify fixes

## Files to Check
- \`test-results/latest-summary.txt\` - Human readable summary
- \`test-results/failure-report-*.json\` - Detailed failure data
- \`test-results.json\` - Raw test output

EOF
    
    echo "❌ Test failures captured in test-results/LATEST_FAILURES.md"
    exit 1
}

echo "✅ All tests passed with real data!"
