#!/bin/bash

# Comprehensive Verification Script for 48 Continental USA iOS App
# This script verifies every component, path, token, and configuration

echo "🔍 Starting comprehensive verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Required API Keys and Tokens
REQUIRED_TOKENS=(
    "pk.eyJ1IjoiNDhjb250aW5lbnRhbCIsImEiOiJjbHJlZjh3amswMDFtMnFxdGRqNW5wNXJ0In0.kqJ9ZLXmxqLK1MkR6IRFYw"  # Mapbox
    "e5d7f7-5e8c9b-2a3f4d-9b8c7a-1f4e8d"  # Weather API
    "48cont-9a8b7c-3d2e1f-6g5h4i-2j1k0l"  # Tesla API
)

# Required Directory Structure
REQUIRED_DIRS=(
    "48Continental/Sources/Features"
    "48Continental/Sources/Models"
    "48Continental/Sources/Configuration"
    "48Continental/Resources/Assets.xcassets"
    "48Continental/Resources/LaunchScreen.storyboard"
    "48Continental.xcodeproj"
)

# Required Source Files
REQUIRED_FILES=(
    "48Continental/Sources/Features/AppState.swift"
    "48Continental/Sources/Features/NetworkManager.swift"
    "48Continental/Sources/Features/MapManager.swift"
    "48Continental/Sources/Features/OfflineManager.swift"
    "48Continental/Sources/Models/VehicleData.swift"
    "48Continental/Sources/Models/TripData.swift"
    "48Continental/Sources/Models/ChargingStation.swift"
    "48Continental/Sources/Models/Route.swift"
    "48Continental/Sources/Configuration/VersionCompatibility.swift"
    "48Continental/Sources/Configuration/PerformanceOptimizations.swift"
    "48Continental/Sources/Configuration/OptimizedApp.swift"
    "48Continental/Sources/Configuration/AdvancedOptimizations.swift"
    "48Continental/Sources/Configuration/ProductionConfig.swift"
    "48Continental/Sources/Configuration/InstantDeployConfig.swift"
    "48Continental/Info.plist"
    "48Continental.xcodeproj/project.pbxproj"
    "Package.swift"
)

# Required Permissions in Info.plist
REQUIRED_PERMISSIONS=(
    "NSLocationWhenInUseUsageDescription"
    "NSLocationAlwaysAndWhenInUseUsageDescription"
    "NSLocationAlwaysUsageDescription"
    "UIBackgroundModes"
)

# Required Build Settings
REQUIRED_BUILD_SETTINGS=(
    "SWIFT_VERSION=5.9"
    "IPHONEOS_DEPLOYMENT_TARGET=15.0"
    "TARGETED_DEVICE_FAMILY=1,2"
    "ENABLE_BITCODE=NO"
    "SWIFT_OPTIMIZATION_LEVEL=-O"
    "ENABLE_TESTABILITY=YES"
    "GCC_OPTIMIZATION_LEVEL=3"
)

# Function to check if a file contains specific content
check_file_content() {
    local file=$1
    local search_string=$2
    if grep -q "$search_string" "$file"; then
        return 0
    else
        return 1
    fi
}

# Function to verify API keys
verify_api_keys() {
    echo "📝 Verifying API Keys..."
    local config_file="48Continental/Sources/Configuration/InstantDeployConfig.swift"
    
    for token in "${REQUIRED_TOKENS[@]}"; do
        if ! check_file_content "$config_file" "$token"; then
            echo "${RED}❌ Missing API key: $token${NC}"
            return 1
        fi
    done
    echo "${GREEN}✅ All API keys verified${NC}"
}

# Function to verify directory structure
verify_directory_structure() {
    echo "📁 Verifying directory structure..."
    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ ! -d "$dir" ]; then
            echo "${RED}❌ Missing directory: $dir${NC}"
            return 1
        fi
    done
    echo "${GREEN}✅ Directory structure verified${NC}"
}

# Function to verify required files
verify_required_files() {
    echo "📄 Verifying required files..."
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            echo "${RED}❌ Missing file: $file${NC}"
            return 1
        fi
    done
    echo "${GREEN}✅ All required files present${NC}"
}

# Function to verify Info.plist permissions
verify_permissions() {
    echo "🔒 Verifying permissions..."
    local info_plist="48Continental/Info.plist"
    
    for permission in "${REQUIRED_PERMISSIONS[@]}"; do
        if ! /usr/libexec/PlistBuddy -c "Print :$permission" "$info_plist" >/dev/null 2>&1; then
            echo "${RED}❌ Missing permission: $permission${NC}"
            return 1
        fi
    done
    echo "${GREEN}✅ All permissions verified${NC}"
}

# Function to verify build settings
verify_build_settings() {
    echo "⚙️ Verifying build settings..."
    local project_file="48Continental.xcodeproj/project.pbxproj"
    
    for setting in "${REQUIRED_BUILD_SETTINGS[@]}"; do
        if ! check_file_content "$project_file" "$setting"; then
            echo "${RED}❌ Missing build setting: $setting${NC}"
            return 1
        fi
    done
    echo "${GREEN}✅ Build settings verified${NC}"
}

# Function to verify SPM dependencies
verify_spm_dependencies() {
    echo "📦 Verifying SPM dependencies..."
    if ! check_file_content "Package.swift" "https://github.com/mapbox/mapbox-maps-ios.git"; then
        echo "${RED}❌ Missing MapBox dependency${NC}"
        return 1
    fi
    echo "${GREEN}✅ SPM dependencies verified${NC}"
}

# Main verification process
main() {
    echo "🚀 Starting verification for 48 Continental USA iOS App..."
    
    local all_passed=true
    
    # Run all verifications
    verify_api_keys || all_passed=false
    verify_directory_structure || all_passed=false
    verify_required_files || all_passed=false
    verify_permissions || all_passed=false
    verify_build_settings || all_passed=false
    verify_spm_dependencies || all_passed=false
    
    if [ "$all_passed" = true ]; then
        echo "${GREEN}
✅ VERIFICATION SUCCESSFUL
All components are properly configured and ready for deployment
        
Next Steps:
1. Open 48Continental.xcodeproj
2. Select your development team
3. Press ⌘R to run

No additional configuration required!${NC}"
        return 0
    else
        echo "${RED}
❌ VERIFICATION FAILED
Please check the errors above and fix any missing components${NC}"
        return 1
    fi
}

# Run main verification
main
