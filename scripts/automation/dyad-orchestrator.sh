#!/bin/bash
# 🤖 DYAD AUTONOMOUS ORCHESTRATOR
# Coordinates Dyad AI agent with intelligent Ollama model load balancing

# Get script directory dynamically
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKSPACE="$SCRIPT_DIR"
DYAD_DIR="/Users/joe/Projects/Personal/dyad"
BRIEFING_FILE="$WORKSPACE/dyad-comprehensive-briefing.json"
BALANCER_SCRIPT="$WORKSPACE/smart-model-balancer.sh"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  🤖 DYAD AUTONOMOUS ORCHESTRATOR              ║"
    echo "║                                                              ║"
    echo "║  Tesla Road Trip Tracker - Autonomous Code Quality Agent    ║"
    echo "║  Target: 217 ESLint warnings → 0 warnings                   ║"
    echo "║  Mode: FULLY AUTONOMOUS with intelligent load balancing     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${CYAN}🔍 Checking prerequisites...${NC}"
    
    # Check if Dyad is running
    if ! pgrep -f "Electron.*dyad" > /dev/null; then
        echo -e "${RED}❌ Dyad is not running${NC}"
        echo -e "${YELLOW}Starting Dyad...${NC}"
        cd "$DYAD_DIR" && npm start &
        sleep 5
    else
        echo -e "${GREEN}✅ Dyad is running${NC}"
    fi
    
    # Check Ollama
    if ! curl -s http://localhost:11434/api/tags > /dev/null; then
        echo -e "${RED}❌ Ollama is not accessible${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Ollama is accessible${NC}"
    fi
    
    # Check models
    echo -e "${CYAN}🧠 Available models:${NC}"
    curl -s http://localhost:11434/api/tags | jq -r '.models[].name' | while read model; do
        echo -e "${GREEN}  ✅ $model${NC}"
    done
    
    return 0
}

# Get current ESLint status
get_eslint_status() {
    echo -e "${CYAN}📊 Analyzing current ESLint status...${NC}"
    cd "$WORKSPACE/frontend"
    
    # Run ESLint and parse warnings
    local lint_output=$(npm run lint 2>&1)
    local warning_count=$(echo "$lint_output" | grep -c "warning" || echo "0")
    local error_count=$(echo "$lint_output" | grep -c "error" || echo "0")
    
    echo -e "${BLUE}Current Status:${NC}"
    echo -e "  Errors: ${RED}$error_count${NC}"
    echo -e "  Warnings: ${YELLOW}$warning_count${NC}"
    
    # Categorize warnings
    echo -e "${CYAN}📋 Warning Categories:${NC}"
    local unused_imports=$(echo "$lint_output" | grep -c "is defined but never used\|imported but never used" || echo "0")
    local any_types=$(echo "$lint_output" | grep -c "@typescript-eslint/no-explicit-any" || echo "0")
    local console_logs=$(echo "$lint_output" | grep -c "no-console" || echo "0")
    local hook_deps=$(echo "$lint_output" | grep -c "react-hooks/exhaustive-deps" || echo "0")
    
    echo -e "  Unused imports/variables: ${YELLOW}$unused_imports${NC}"
    echo -e "  TypeScript 'any' types: ${YELLOW}$any_types${NC}"
    echo -e "  Console statements: ${YELLOW}$console_logs${NC}"
    echo -e "  Hook dependencies: ${YELLOW}$hook_deps${NC}"
    
    return $warning_count
}

# Create dynamic task plan
create_task_plan() {
    local warning_count=$1
    
    echo -e "${PURPLE}🎯 Creating intelligent task plan...${NC}"
    
    cat > "$WORKSPACE/autonomous-task-plan.json" << EOF
{
  "mission": "Autonomous Tesla App Code Quality Optimization",
  "target": "0 ESLint warnings",
  "current_warnings": $warning_count,
  "execution_strategy": "$([ $warning_count -gt 100 ] && echo "HIGH_VOLUME_PARALLEL" || echo "STANDARD_SEQUENTIAL")",
  "task_sequence": [
    {
      "phase": 1,
      "description": "Quick wins - unused imports/variables",
      "model": "phi3:latest",
      "execution": "parallel",
      "estimated_fixes": "$([ $warning_count -gt 100 ] && echo "60-80" || echo "20-30")"
    },
    {
      "phase": 2, 
      "description": "TypeScript type optimization",
      "model": "gemma3:4b",
      "execution": "parallel",
      "estimated_fixes": "$([ $warning_count -gt 100 ] && echo "30-50" || echo "10-20")"
    },
    {
      "phase": 3,
      "description": "Console statement cleanup", 
      "model": "phi3:latest",
      "execution": "parallel",
      "estimated_fixes": "$([ $warning_count -gt 100 ] && echo "20-40" || echo "5-15")"
    },
    {
      "phase": 4,
      "description": "Complex logic and hook dependencies",
      "model": "codellama:7b", 
      "execution": "sequential",
      "estimated_fixes": "$([ $warning_count -gt 100 ] && echo "20-30" || echo "5-10")"
    },
    {
      "phase": 5,
      "description": "Final validation and quality assurance",
      "model": "mistral:latest",
      "execution": "sequential", 
      "estimated_fixes": "0 (validation only)"
    }
  ],
  "autonomous_permissions": [
    "Edit React/TypeScript files",
    "Remove unused imports/variables", 
    "Fix type definitions",
    "Remove console statements",
    "Optimize hook dependencies",
    "Validate functionality preservation"
  ],
  "safety_constraints": [
    "Preserve all API functionality",
    "Maintain component behavior",
    "Keep test compatibility",
    "No build system changes"
  ]
}
EOF

    echo -e "${GREEN}✅ Task plan created: autonomous-task-plan.json${NC}"
}

# Execute autonomous workflow
execute_autonomous_workflow() {
    echo -e "${PURPLE}🚀 Initiating autonomous workflow...${NC}"
    
    # Create comprehensive briefing for Dyad
    local briefing_message=$(cat << 'EOF'
🤖 AUTONOMOUS MISSION BRIEFING

You are now operating as an autonomous coding agent for the Tesla Road Trip Tracker application.

MISSION OBJECTIVES:
• Eliminate all 217 ESLint warnings
• Maintain maximum code quality standards  
• Preserve 100% functionality
• Operate without human intervention

INTELLIGENT MODEL RESOURCES:
• phi3:latest (2.2GB) - Fast simple fixes
• gemma3:4b (4.3GB) - TypeScript analysis
• codellama:7b (3.8GB) - Complex refactoring
• mistral:latest (7.2GB) - Validation

EXECUTION STRATEGY:
1. Use smart-model-balancer.sh for optimal model selection
2. Process high-volume fixes in parallel (unused imports, console logs)
3. Handle complex logic sequentially (hook dependencies)
4. Validate all changes with comprehensive model

WORKSPACE CONTEXT:
• Frontend: /Users/joe/Projects/Personal/ContinentalUSA/frontend/
• Current warnings: 217
• Technology: React 18.3.1 + TypeScript + ESLint v9
• Previous success: AdminPortal.tsx (19→0 warnings)

AUTONOMOUS PERMISSIONS:
✅ Edit any React/TypeScript file
✅ Remove unused imports/variables
✅ Fix TypeScript types  
✅ Remove console statements
✅ Optimize hook dependencies
✅ Run validation tests

SAFETY CONSTRAINTS:
❌ No API contract changes
❌ No build configuration modifications
❌ No functionality alterations
❌ No test file changes

Execute this mission autonomously using the intelligent model balancing system. Begin immediately.
EOF
)

    echo -e "${CYAN}📡 Sending briefing to Dyad...${NC}"
    echo "$briefing_message"
    
    echo -e "${YELLOW}⏳ Dyad is now operating autonomously...${NC}"
    echo -e "${CYAN}💡 Monitor progress in Dyad interface${NC}"
    echo -e "${CYAN}📊 Check ESLint status: cd frontend && npm run lint${NC}"
}

# Monitor progress
monitor_progress() {
    echo -e "${CYAN}📊 Monitoring autonomous progress...${NC}"
    
    local initial_warnings=$(get_eslint_status | tail -1)
    echo -e "${BLUE}Initial warnings: $initial_warnings${NC}"
    
    while true; do
        sleep 30
        local current_warnings=$(cd "$WORKSPACE/frontend" && npm run lint 2>&1 | grep -c "warning" || echo "0")
        local timestamp=$(date '+%H:%M:%S')
        
        echo -e "${YELLOW}[$timestamp] Current warnings: $current_warnings${NC}"
        
        if [ "$current_warnings" -eq 0 ]; then
            echo -e "${GREEN}🎉 MISSION ACCOMPLISHED! 0 warnings achieved!${NC}"
            break
        fi
        
        # Check if Dyad is still running
        if ! pgrep -f "Electron.*dyad" > /dev/null; then
            echo -e "${RED}⚠️  Dyad process stopped${NC}"
            break
        fi
    done
}

# Main execution
main() {
    print_banner
    
    case "$1" in
        "start")
            check_prerequisites || exit 1
            get_eslint_status
            local warning_count=$?
            create_task_plan $warning_count
            execute_autonomous_workflow
            ;;
        "monitor")
            monitor_progress
            ;;
        "status")
            get_eslint_status
            ;;
        "brief")
            execute_autonomous_workflow
            ;;
        *)
            echo -e "${CYAN}Usage: $0 {start|monitor|status|brief}${NC}"
            echo ""
            echo -e "${YELLOW}Commands:${NC}"
            echo -e "  start   - Full autonomous workflow initiation"
            echo -e "  monitor - Monitor progress in real-time"
            echo -e "  status  - Check current ESLint status"
            echo -e "  brief   - Send briefing to Dyad"
            ;;
    esac
}

main "$@"
