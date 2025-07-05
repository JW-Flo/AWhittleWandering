#!/bin/bash
# Script to setup VS Code as an MCP client for the 48 Continental project

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up VS Code as an MCP client for the 48 Continental project...${NC}"

# Create VS Code settings directory if it doesn't exist
mkdir -p .vscode

# Check if the GitHub Copilot extension is installed
echo -e "${YELLOW}Checking for GitHub Copilot extension...${NC}"
if code --list-extensions | grep -q "GitHub.copilot"; then
    echo -e "${GREEN}GitHub Copilot extension is installed.${NC}"
else
    echo -e "${RED}GitHub Copilot extension is NOT installed.${NC}"
    echo -e "${YELLOW}Installing GitHub Copilot extension...${NC}"
    code --install-extension GitHub.copilot
fi

# Check if the GitHub Copilot Chat extension is installed
echo -e "${YELLOW}Checking for GitHub Copilot Chat extension...${NC}"
if code --list-extensions | grep -q "GitHub.copilot-chat"; then
    echo -e "${GREEN}GitHub Copilot Chat extension is installed.${NC}"
else
    echo -e "${RED}GitHub Copilot Chat extension is NOT installed.${NC}"
    echo -e "${YELLOW}Installing GitHub Copilot Chat extension...${NC}"
    code --install-extension GitHub.copilot-chat
fi

# Check if Jupyter extension is installed (useful for notebook-based interactions)
echo -e "${YELLOW}Checking for Jupyter extension...${NC}"
if code --list-extensions | grep -q "ms-toolsai.jupyter"; then
    echo -e "${GREEN}Jupyter extension is installed.${NC}"
else
    echo -e "${RED}Jupyter extension is NOT installed.${NC}"
    echo -e "${YELLOW}Installing Jupyter extension...${NC}"
    code --install-extension ms-toolsai.jupyter
fi

# Create VS Code settings file if it doesn't exist
if [ ! -f .vscode/settings.json ]; then
    echo -e "${YELLOW}Creating VS Code settings file...${NC}"
    cat > .vscode/settings.json << EOF
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll": true
    },
    "github.copilot.enable": {
        "*": true
    },
    "github.copilot.chat.locales": {
        "*": true
    }
}
EOF
    echo -e "${GREEN}VS Code settings file created.${NC}"
else
    echo -e "${GREEN}VS Code settings file already exists.${NC}"
fi

# Create MCP config file if it doesn't exist
if [ ! -f .vscode/mcp-config.json ]; then
    echo -e "${YELLOW}Creating MCP config file...${NC}"
    cat > .vscode/mcp-config.json << EOF
{
  "mcpServers": {
    "mas-sequential-thinking": {
      "command": "${PWD}/mcp-sequential-thinking/.venv/bin/python",
      "args": [
        "${PWD}/mcp-sequential-thinking/main.py"
      ],
      "env": {
        "LLM_PROVIDER": "deepseek",
        "DEEPSEEK_API_KEY": "\${env:DEEPSEEK_API_KEY}",
        "EXA_API_KEY": "\${env:EXA_API_KEY}"
      }
    },
    "mcp-48continental": {
      "connection": {
        "protocol": "http",
        "host": "localhost",
        "port": 3100
      }
    }
  }
}
EOF
    echo -e "${GREEN}MCP config file created.${NC}"
else
    echo -e "${GREEN}MCP config file already exists.${NC}"
fi

# Install Python dependencies for the MCP sequential thinking server
echo -e "${YELLOW}Installing Python dependencies for the MCP sequential thinking server...${NC}"
cd mcp-sequential-thinking
if command -v uv &> /dev/null; then
    echo -e "${GREEN}Using uv to install dependencies...${NC}"
    uv pip install -e .
else
    echo -e "${YELLOW}uv not found, using pip instead...${NC}"
    pip install -e .
fi
cd ..

echo -e "${GREEN}VS Code setup as MCP client is complete!${NC}"
echo -e "${YELLOW}Please follow these steps to finish the setup:${NC}"
echo -e "1. Ensure you have the required API keys in your environment variables:"
echo -e "   - DEEPSEEK_API_KEY (or your chosen LLM provider)"
echo -e "   - EXA_API_KEY (optional, for research capabilities)"
echo -e "2. Start the MCP server with: docker-compose -f docker-compose.sequential-thinking.yml up -d"
echo -e "3. Restart VS Code if it was open during this setup"
echo -e "4. In VS Code, open the Copilot Chat panel and you should be able to use sequential thinking"
