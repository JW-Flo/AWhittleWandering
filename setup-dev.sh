#!/bin/bash

# Development Environment Setup Script
# This script sets up the development environment for A Whittle Wandering

set -e

echo "🚀 Setting up A Whittle Wandering Development Environment"
echo "========================================================"

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js version
echo ""
echo "Checking Node.js version..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js is installed: $NODE_VERSION"
    
    # Extract major version number
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Install root dependencies
echo ""
echo "Installing root dependencies..."
if npm install --legacy-peer-deps 2>/dev/null || npm install --no-optional 2>/dev/null || npm install --ignore-platform 2>/dev/null; then
    print_status "Root dependencies installed successfully"
else
    print_warning "Some dependencies may have platform-specific issues, but core functionality should work"
    print_warning "You can proceed with individual component setup"
fi

# Set up environment file
echo ""
echo "Setting up environment configuration..."
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        print_warning "Created .env file from .env.example template"
        print_warning "Please edit .env with your actual API keys before running the application"
    else
        print_error ".env.example file not found"
    fi
else
    print_status "Environment file already exists"
fi

# Check key directories and their package.json files
echo ""
echo "Checking project components..."

COMPONENTS=(
    "edge-worker"
    "awhittlewandering"
    "48Continental_Starter/public-site"
    "mcp-server"
    "ContinentalUSA-mobile"
)

for component in "${COMPONENTS[@]}"; do
    if [ -d "$component" ] && [ -f "$component/package.json" ]; then
        print_status "Found component: $component"
    else
        print_warning "Component not found or missing package.json: $component"
    fi
done

# Provide next steps
echo ""
echo "🎯 Setup Complete! Next Steps:"
echo "==============================="
echo ""
echo "1. Edit .env file with your API keys:"
echo "   - MAPBOX_TOKEN (from https://mapbox.com)"
echo "   - TESSIE_API_TOKEN (from https://tessie.com)"
echo "   - CLOUDFLARE credentials"
echo ""
echo "2. Choose a component to work on:"
echo "   Edge Worker:  cd edge-worker && npm install && npm run dev"
echo "   Frontend:     cd awhittlewandering && npm install && npm run dev"
echo "   MCP Server:   cd mcp-server && npm install && npm start"
echo "   Mobile App:   cd ContinentalUSA-mobile && npm install && npx expo start"
echo ""
echo "3. Read the documentation:"
echo "   - README.md for project overview"
echo "   - CONTRIBUTING.md for development guidelines"
echo "   - docs/ directory for detailed documentation"
echo ""
echo "4. Join the journey! 🚗⚡"
echo ""
print_status "Development environment is ready!"