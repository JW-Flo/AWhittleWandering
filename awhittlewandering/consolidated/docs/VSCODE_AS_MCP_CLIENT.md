# VS Code as an MCP Client for 48 Continental Project

This document explains how to set up and use Visual Studio Code (VS Code) as a Model Context Protocol (MCP) client for the 48 Continental Project. This setup enables VS Code to communicate with the MCP server, including the advanced sequential thinking capabilities provided by the Multi-Agent System (MAS).

## Prerequisites

Before setting up VS Code as an MCP client, ensure you have:

1. [Visual Studio Code](https://code.visualstudio.com/) installed
2. [Docker](https://www.docker.com/) installed and running
3. Required API keys:
   - `DEEPSEEK_API_KEY` (default LLM provider)
   - `EXA_API_KEY` (optional, for research capabilities)
   - Other supported LLM providers: `GROQ_API_KEY`, `OPENROUTER_API_KEY`

## Setup Instructions

### Automated Setup

Run the provided setup script to automatically configure VS Code as an MCP client:

```bash
./scripts/setup-vscode-as-mcp-client.sh
```

This script will:

- Install necessary VS Code extensions
- Create required configuration files
- Install Python dependencies for the MCP sequential thinking server

### Manual Setup

If you prefer to set up manually, follow these steps:

1. Install required VS Code extensions:
   - GitHub Copilot (`GitHub.copilot`)
   - GitHub Copilot Chat (`GitHub.copilot-chat`)
   - Jupyter (`ms-toolsai.jupyter`)

2. Create the VS Code MCP configuration file at `.vscode/mcp-config.json`:

   ```json
   {
     "mcpServers": {
       "mas-sequential-thinking": {
         "command": "python",
         "args": [
           "/path/to/mcp-sequential-thinking/main.py"
         ],
         "env": {
           "LLM_PROVIDER": "deepseek",
           "DEEPSEEK_API_KEY": "${env:DEEPSEEK_API_KEY}",
           "EXA_API_KEY": "${env:EXA_API_KEY}"
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
   ```

3. Install Python dependencies for the MCP sequential thinking server:

   ```bash
   cd mcp-sequential-thinking
   pip install -e .
   ```

## Starting the MCP Server

Start the MCP server with sequential thinking capabilities:

```bash
./scripts/start-mcp-sequential-thinking.sh
```

This script will:

- Check for the necessary environment variables
- Start the Docker containers for the MCP server
- Verify that the server is running correctly

## Using VS Code as an MCP Client

Once everything is set up and the MCP server is running:

1. Open VS Code
2. Access GitHub Copilot Chat (Ctrl+Shift+I or Cmd+Shift+I on macOS)
3. You can now use the MCP server and its sequential thinking capabilities through VS Code

### Using Sequential Thinking

The sequential thinking tool helps break down complex problems into manageable steps. To use it:

1. In Copilot Chat, describe a complex task or problem
2. The Multi-Agent System will process your request using specialized agents:
   - Planner: Maps out strategies to solve the problem
   - Researcher: Gathers information when needed
   - Analyzer: Examines details and implications
   - Critic: Identifies potential issues and improvements
   - Synthesizer: Combines insights into a cohesive solution

### Advanced Features

The MCP Sequential Thinking system supports:

- **Thought Branches**: Exploring alternative solution paths
- **Revisions**: Refining and improving previous steps
- **External Research**: Gathering information from the web via the Exa tool
- **Detailed Logging**: Tracking the entire thinking process

## Troubleshooting

If you encounter issues:

1. Check that all required API keys are set in your environment
2. Verify that the MCP server is running with `docker ps`
3. Check the server logs with `docker-compose -f docker-compose.sequential-thinking.yml logs`
4. Restart VS Code after making configuration changes
5. Ensure the GitHub Copilot extensions are properly authenticated

## Additional Resources

- [MCP Sequential Thinking Documentation](https://github.com/FradSer/mcp-server-mas-sequential-thinking)
- [48 Continental Project Documentation](/docs)
- [Model Context Protocol (MCP) Documentation](https://modelcontextprotocol.github.io/mcp/)
