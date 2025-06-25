#!/bin/bash
# Repository Readiness Validation Script
# Tests that the repository is properly prepared for engineer sharing

set -e

echo "===========================================" 
echo "Repository Readiness Validation"
echo "==========================================="

# Function to check if file exists and is not empty
check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$file" ] && [ -s "$file" ]; then
        echo "✅ $description: $file"
        return 0
    else
        echo "❌ $description: $file (missing or empty)"
        return 1
    fi
}

# Function to check if directory exists
check_directory() {
    local dir=$1
    local description=$2
    
    if [ -d "$dir" ]; then
        echo "✅ $description: $dir"
        return 0
    else
        echo "❌ $description: $dir (missing)"
        return 1
    fi
}

echo ""
echo "📚 Documentation Check"
echo "---------------------"
check_file "README.md" "Project README"
check_file "CONTRIBUTING.md" "Contribution guidelines"
check_file "CHANGELOG.md" "Change log"
check_file "LICENSE" "License file"

echo ""
echo "🔧 Configuration Check"
echo "----------------------"
check_file ".gitignore" "Git ignore file"
check_file "package.json" "Root package.json"
check_file ".eslintrc.json" "ESLint configuration"
check_directory ".github/workflows" "GitHub Actions workflows"
check_file ".github/dependabot.yml" "Dependabot configuration"

echo ""
echo "📋 Templates Check"
echo "------------------"
check_file ".github/pull_request_template.md" "Pull request template"
check_directory ".github/ISSUE_TEMPLATE" "Issue templates directory"
check_file ".github/ISSUE_TEMPLATE/bug_report.md" "Bug report template"
check_file ".github/ISSUE_TEMPLATE/feature_request.md" "Feature request template"
check_file ".github/ISSUE_TEMPLATE/documentation.md" "Documentation template"

echo ""
echo "🏗️ Build System Check"
echo "----------------------"
echo "Testing root build process..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Root build process works"
else
    echo "❌ Root build process failed"
fi

echo "Testing lint process..."
if npm run test:lint > /dev/null 2>&1; then
    echo "✅ Linting works"
else
    echo "❌ Linting failed"
fi

echo ""
echo "🔒 Security Check"
echo "-----------------"
echo "Checking for exposed secrets..."
if grep -r "sk-" . --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" --include="*.json" --include="*.md" | grep -q "sk-proj\|sk-live\|sk-test"; then
    echo "❌ Potential API keys found in code"
else
    echo "✅ No exposed API keys found"
fi

echo "Checking .gitignore coverage..."
if grep -q "\.env" .gitignore && grep -q "node_modules" .gitignore && grep -q "dist/" .gitignore; then
    echo "✅ Essential patterns in .gitignore"
else
    echo "❌ Missing essential .gitignore patterns"
fi

echo ""
echo "📁 Repository Structure Check"
echo "-----------------------------"
check_directory "48Continental_Starter/public-site" "Frontend application"
check_directory "edge-worker" "Edge worker"
check_directory "docs" "Documentation directory"
check_directory "scripts" "Scripts directory"

echo ""
echo "🧪 Testing Infrastructure"
echo "-------------------------"
if [ -f "awhittlewandering/package.json" ]; then
    echo "✅ Test infrastructure exists in awhittlewandering/"
else
    echo "⚠️  Test infrastructure needs setup in awhittlewandering/"
fi

echo ""
echo "=========================================="
echo "Repository Readiness Summary"
echo "=========================================="

# Count successful checks
total_checks=0
failed_checks=0

# Re-run checks silently to count results
total_checks=$((total_checks + 1))
check_file "README.md" "README" > /dev/null || failed_checks=$((failed_checks + 1))

total_checks=$((total_checks + 1))
check_file "CONTRIBUTING.md" "CONTRIBUTING" > /dev/null || failed_checks=$((failed_checks + 1))

total_checks=$((total_checks + 1))
check_file "CHANGELOG.md" "CHANGELOG" > /dev/null || failed_checks=$((failed_checks + 1))

total_checks=$((total_checks + 1))
check_file "LICENSE" "LICENSE" > /dev/null || failed_checks=$((failed_checks + 1))

total_checks=$((total_checks + 1))
npm run build > /dev/null 2>&1 || failed_checks=$((failed_checks + 1))

total_checks=$((total_checks + 1))
npm run test:lint > /dev/null 2>&1 || failed_checks=$((failed_checks + 1))

passed_checks=$((total_checks - failed_checks))

echo "Passed: $passed_checks/$total_checks checks"

if [ $failed_checks -eq 0 ]; then
    echo "🎉 Repository is ready for engineer sharing!"
    exit 0
else
    echo "⚠️  Repository needs attention before sharing"
    exit 1
fi