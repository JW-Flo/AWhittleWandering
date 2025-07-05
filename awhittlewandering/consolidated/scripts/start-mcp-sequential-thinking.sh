#!/bin/bash
# Script to start the MCP server with sequential thinking

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting the MCP server with sequential thinking...${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}Docker is not running. Please start Docker and try again.${NC}"
  exit 1
fi

# Check if the environment variables are set
if [ -z "${DEEPSEEK_API_KEY}" ] && [ -z "${GROQ_API_KEY}" ] && [ -z "${OPENROUTER_API_KEY}" ]; then
  echo -e "${RED}Warning: No LLM API key found in environment variables.${NC}"
  echo -e "${YELLOW}You need to set one of the following environment variables:${NC}"
  echo -e "  - DEEPSEEK_API_KEY (default)"
  echo -e "  - GROQ_API_KEY"
  echo -e "  - OPENROUTER_API_KEY"
  echo -e "${YELLOW}Continuing anyway, but the MCP server may not work properly.${NC}"
fi

# Start the Docker containers
echo -e "${YELLOW}Starting Docker containers...${NC}"
docker-compose -f docker-compose.sequential-thinking.yml up -d

# Wait for the MCP server to start
echo -e "${YELLOW}Waiting for the MCP server to start...${NC}"
attempt=0
max_attempts=30
until curl -s http://localhost:8080/healthz > /dev/null || [ $attempt -ge $max_attempts ]; do
  echo -e "${YELLOW}Waiting for MCP server to be ready... ($((attempt+1))/$max_attempts)${NC}"
  sleep 2
  attempt=$((attempt+1))
done

if [ $attempt -ge $max_attempts ]; then
  echo -e "${RED}MCP server did not start in the expected time. Check the logs:${NC}"
  docker-compose -f docker-compose.sequential-thinking.yml logs
  exit 1
else
  echo -e "${GREEN}MCP server is now running and ready for use!${NC}"
  echo -e "${YELLOW}You can use VS Code as an MCP client to interact with it.${NC}"
  echo -e "${YELLOW}To stop the server, run: docker-compose -f docker-compose.sequential-thinking.yml down${NC}"
fi
