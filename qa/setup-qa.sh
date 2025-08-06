#!/bin/bash

# QA System Setup Script
# Sets up the complete recursive QA pipeline

set -e

PROJECT_ROOT="/Users/joe/Projects/Personal/ContinentalUSA"
QA_DIR="$PROJECT_ROOT/qa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[QA-SETUP]${NC} $1"
}

success() {
    echo -e "${GREEN}[QA-SETUP]${NC} ✅ $1"
}

warn() {
    echo -e "${YELLOW}[QA-SETUP]${NC} ⚠️ $1"
}

error() {
    echo -e "${RED}[QA-SETUP]${NC} ❌ $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    local major_version=$(echo $node_version | cut -d'.' -f1)
    
    if [[ $major_version -lt 18 ]]; then
        error "Node.js version 18 or higher is required (current: $node_version)"
        exit 1
    fi
    
    success "Node.js version: $node_version"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
        exit 1
    fi
    
    success "npm version: $(npm --version)"
    
    # Check git
    if ! command -v git &> /dev/null; then
        error "git is not installed"
        exit 1
    fi
    
    success "git version: $(git --version | cut -d' ' -f3)"
    
    # Check jq (for JSON processing)
    if ! command -v jq &> /dev/null; then
        warn "jq is not installed (optional, but recommended)"
        echo "Install with: brew install jq"
    else
        success "jq version: $(jq --version)"
    fi
    
    # Check bc (for calculations)
    if ! command -v bc &> /dev/null; then
        warn "bc is not installed (required for monitoring)"
        echo "Install with: brew install bc"
    else
        success "bc is available"
    fi
}

# Create directory structure
setup_directories() {
    log "Setting up directory structure..."
    
    mkdir -p "$QA_DIR"/{logs,reports,screenshots,alerts,temp}
    
    success "Created QA directory structure"
}

# Install dependencies
install_dependencies() {
    log "Installing QA dependencies..."
    
    cd "$QA_DIR"
    
    # Install QA-specific dependencies
    if [[ -f package.json ]]; then
        npm install
        success "Installed QA dependencies"
    else
        error "QA package.json not found"
        exit 1
    fi
    
    # Install frontend test dependencies if missing
    cd "$PROJECT_ROOT/frontend"
    if [[ ! -d node_modules/@testing-library ]]; then
        log "Installing frontend testing dependencies..."
        npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event vitest jsdom
        success "Installed frontend testing dependencies"
    fi
    
    # Install Puppeteer if not present
    if [[ ! -d node_modules/puppeteer ]]; then
        log "Installing Puppeteer..."
        npm install puppeteer
        success "Installed Puppeteer"
    fi
}

# Setup Git hooks
setup_git_hooks() {
    log "Setting up Git hooks..."
    
    local hooks_dir="$PROJECT_ROOT/.git/hooks"
    
    # Pre-push hook
    cat > "$hooks_dir/pre-push" << 'EOF'
#!/bin/bash
# QA Pre-push Hook

QA_DIR="$(git rev-parse --show-toplevel)/qa"

if [[ -f "$QA_DIR/config.json" ]]; then
    # Check if QA is enabled for pre-push
    if jq -e '.qa.automation.gitHooks.prePush' "$QA_DIR/config.json" | grep -q true; then
        echo "🧪 Running pre-push QA checks..."
        
        if cd "$QA_DIR" && node recursive-qa-pipeline.js 1; then
            echo "✅ Pre-push QA checks passed"
            exit 0
        else
            echo "❌ Pre-push QA checks failed"
            echo "Fix issues before pushing or use --no-verify to skip"
            exit 1
        fi
    fi
fi

exit 0
EOF
    
    # Post-merge hook
    cat > "$hooks_dir/post-merge" << 'EOF'
#!/bin/bash
# QA Post-merge Hook

QA_DIR="$(git rev-parse --show-toplevel)/qa"

if [[ -f "$QA_DIR/config.json" ]]; then
    # Check if QA is enabled for post-merge
    if jq -e '.qa.automation.gitHooks.postMerge' "$QA_DIR/config.json" | grep -q true; then
        echo "🧪 Running post-merge QA checks..."
        
        # Run in background to not block user
        nohup bash -c "cd '$QA_DIR' && node recursive-qa-pipeline.js 2" > /dev/null 2>&1 &
        
        echo "✅ Post-merge QA checks started in background"
    fi
fi

exit 0
EOF
    
    # Make hooks executable
    chmod +x "$hooks_dir/pre-push" "$hooks_dir/post-merge"
    
    success "Git hooks installed"
}

# Update main package.json with QA scripts
update_main_package_json() {
    log "Updating main package.json with QA scripts..."
    
    cd "$PROJECT_ROOT"
    
    # Backup existing package.json
    cp package.json package.json.backup
    
    # Add QA scripts using jq if available, otherwise manual editing
    if command -v jq &> /dev/null; then
        jq '.scripts += {
            "qa": "cd qa && npm run qa",
            "qa:full": "cd qa && npm run qa:full",
            "qa:quick": "cd qa && npm run qa:quick",
            "qa:monitor": "cd qa && npm run monitor",
            "qa:report": "cd qa && npm run report",
            "qa:setup": "cd qa && ./setup-qa.sh",
            "deploy:qa": "cd qa && npm run deploy:qa"
        }' package.json > package.json.tmp && mv package.json.tmp package.json
        
        success "Updated package.json with QA scripts"
    else
        warn "jq not available, please manually add QA scripts to package.json"
        echo "Add these scripts to your package.json:"
        echo '  "qa": "cd qa && npm run qa",'
        echo '  "qa:full": "cd qa && npm run qa:full",'
        echo '  "qa:quick": "cd qa && npm run qa:quick",'
        echo '  "qa:monitor": "cd qa && npm run monitor",'
        echo '  "qa:report": "cd qa && npm run report"'
    fi
}

# Create service files for systemd (Linux) or launchd (macOS)
create_service_files() {
    log "Creating service files for continuous monitoring..."
    
    local service_dir="$QA_DIR/services"
    mkdir -p "$service_dir"
    
    # macOS LaunchAgent
    cat > "$service_dir/com.tesla.qa.monitor.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.tesla.qa.monitor</string>
    <key>ProgramArguments</key>
    <array>
        <string>$QA_DIR/recursive-qa-monitor.sh</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$QA_DIR</string>
    <key>RunAtLoad</key>
    <false/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$QA_DIR/logs/monitor.out</string>
    <key>StandardErrorPath</key>
    <string>$QA_DIR/logs/monitor.err</string>
</dict>
</plist>
EOF
    
    # Create start/stop scripts
    cat > "$service_dir/start-monitor.sh" << EOF
#!/bin/bash
# Start QA Monitor Service

if [[ "\$(uname)" == "Darwin" ]]; then
    # macOS
    launchctl load "$service_dir/com.tesla.qa.monitor.plist"
    echo "✅ QA Monitor started (macOS LaunchAgent)"
else
    # Linux (manual process)
    nohup "$QA_DIR/recursive-qa-monitor.sh" > "$QA_DIR/logs/monitor.out" 2>&1 &
    echo \$! > "$QA_DIR/logs/monitor.pid"
    echo "✅ QA Monitor started (background process)"
fi
EOF
    
    cat > "$service_dir/stop-monitor.sh" << EOF
#!/bin/bash
# Stop QA Monitor Service

if [[ "\$(uname)" == "Darwin" ]]; then
    # macOS
    launchctl unload "$service_dir/com.tesla.qa.monitor.plist"
    echo "🛑 QA Monitor stopped (macOS LaunchAgent)"
else
    # Linux (kill process)
    if [[ -f "$QA_DIR/logs/monitor.pid" ]]; then
        kill \$(cat "$QA_DIR/logs/monitor.pid") 2>/dev/null || true
        rm -f "$QA_DIR/logs/monitor.pid"
        echo "🛑 QA Monitor stopped"
    else
        pkill -f "recursive-qa-monitor.sh" || true
        echo "🛑 QA Monitor processes killed"
    fi
fi
EOF
    
    chmod +x "$service_dir"/*.sh
    
    success "Service files created in $service_dir"
    echo "  📱 To start monitoring: $service_dir/start-monitor.sh"
    echo "  🛑 To stop monitoring: $service_dir/stop-monitor.sh"
}

# Create VS Code integration
create_vscode_integration() {
    log "Creating VS Code integration..."
    
    local vscode_dir="$PROJECT_ROOT/.vscode"
    mkdir -p "$vscode_dir"
    
    # Tasks configuration
    cat > "$vscode_dir/tasks.json" << 'EOF'
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "QA: Run Quick Test",
            "type": "shell",
            "command": "npm run qa:quick",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        },
        {
            "label": "QA: Run Full Pipeline",
            "type": "shell",
            "command": "npm run qa:full",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        },
        {
            "label": "QA: Generate Report",
            "type": "shell",
            "command": "npm run qa:report",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        },
        {
            "label": "QA: Start Monitor",
            "type": "shell",
            "command": "./qa/services/start-monitor.sh",
            "group": "test",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared"
            },
            "problemMatcher": []
        }
    ]
}
EOF
    
    # Launch configuration for debugging tests
    if [[ ! -f "$vscode_dir/launch.json" ]]; then
        cat > "$vscode_dir/launch.json" << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug QA Pipeline",
            "type": "node",
            "request": "launch",
            "program": "${workspaceFolder}/qa/recursive-qa-pipeline.js",
            "args": ["1"],
            "cwd": "${workspaceFolder}/qa",
            "console": "integratedTerminal",
            "skipFiles": ["<node_internals>/**"]
        }
    ]
}
EOF
    fi
    
    success "VS Code integration created"
}

# Test installation
test_installation() {
    log "Testing QA installation..."
    
    cd "$QA_DIR"
    
    # Test basic QA pipeline
    if node -e "import('./recursive-qa-pipeline.js').then(() => console.log('✅ QA pipeline script loads correctly'))"; then
        success "QA pipeline script validation passed"
    else
        error "QA pipeline script validation failed"
        exit 1
    fi
    
    # Test dependencies
    if npm list puppeteer vitest &> /dev/null; then
        success "Dependencies validation passed"
    else
        warn "Some dependencies may be missing"
    fi
    
    # Test configuration
    if [[ -f config.json ]] && jq . config.json > /dev/null; then
        success "Configuration file validation passed"
    else
        error "Configuration file validation failed"
        exit 1
    fi
    
    success "Installation test completed"
}

# Display summary
display_summary() {
    echo ""
    echo -e "${GREEN}🎉 QA System Setup Complete!${NC}"
    echo ""
    echo -e "${BLUE}📋 Quick Start Commands:${NC}"
    echo "  npm run qa:quick          # Quick QA check"
    echo "  npm run qa:full           # Full QA pipeline"
    echo "  npm run qa:monitor        # Start continuous monitoring"
    echo "  npm run qa:report         # Generate QA report"
    echo ""
    echo -e "${BLUE}📁 Important Directories:${NC}"
    echo "  $QA_DIR/logs              # QA execution logs"
    echo "  $QA_DIR/reports           # QA reports (JSON & HTML)"
    echo "  $QA_DIR/screenshots       # E2E test screenshots"
    echo "  $QA_DIR/alerts            # Monitoring alerts"
    echo ""
    echo -e "${BLUE}🔧 Configuration:${NC}"
    echo "  $QA_DIR/config.json       # Main QA configuration"
    echo "  $QA_DIR/services/         # Service management scripts"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo "  1. Review and customize $QA_DIR/config.json"
    echo "  2. Run 'npm run qa:quick' to test the setup"
    echo "  3. Consider starting continuous monitoring"
    echo "  4. Set up Slack/email notifications (optional)"
    echo ""
    echo -e "${YELLOW}📖 Documentation:${NC}"
    echo "  All QA scripts include --help options"
    echo "  Check $QA_DIR/README.md for detailed usage"
    echo ""
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                     Tesla App QA Setup                      ║"
    echo "║              Recursive & Repetitive QA Pipeline             ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_prerequisites
    setup_directories
    install_dependencies
    setup_git_hooks
    update_main_package_json
    create_service_files
    create_vscode_integration
    test_installation
    display_summary
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
