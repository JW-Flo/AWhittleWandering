#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Initializing n8n CI/CD setup...${NC}"

# Create directory structure
echo "Creating directory structure..."
mkdir -p backups
mkdir -p scripts

# Move files to correct locations
echo "Organizing files..."
if [ -f "generate-credentials.sh" ]; then
    mv generate-credentials.sh scripts/
fi
if [ -f "backup-n8n.sh" ]; then
    mv backup-n8n.sh scripts/
fi

# Set permissions
echo "Setting file permissions..."
chmod +x scripts/*
chmod 644 .env.example

# Create data directories
echo "Creating data directories..."
mkdir -p data/postgres
mkdir -p data/n8n

# Initialize git if not already a repository
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit: n8n CI/CD setup"
fi

# Verify docker and docker-compose
echo "Checking dependencies..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Generate initial environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "Generating initial environment file..."
    cp .env.example .env
    echo -e "${BLUE}Please update the .env file with your secure credentials${NC}"
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "\nNext steps:"
echo "1. Update the .env file with your secure credentials"
echo "2. Run 'make generate-credentials' to create secure keys"
echo "3. Run 'make start' to launch n8n"
echo -e "\nAccess n8n at: http://localhost:5678 once started"
echo -e "Refer to DEPLOYMENT.md for detailed configuration instructions"
