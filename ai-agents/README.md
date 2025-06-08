# AI Agents Documentation

This directory contains configuration, prompts, and documentation for AI agents used in the "A Whittle Wandering" project. These files are designed to be reusable across projects with minimal modifications.

## Directory Structure

- `/prompts`: Contains prompt templates for specialized AI agents
- `/configs`: Contains MCP (Model Context Protocol) configurations and extension settings
- `/workflows`: Contains workflow definitions and orchestration configurations
- `/tools`: Contains tool definitions and schemas for agent capabilities
- `/docs`: Contains detailed guides and documentation for the agent system
- `/settings`: Contains environment and editor settings

## Agent Types

1. **Map Integration Agent**: Focuses on map rendering, integration, and performance optimization
2. **Weather Integration Agent**: Handles weather data retrieval, processing, and visualization
3. **UI/UX Enhancement Agent**: Manages frontend optimizations and user experience improvements
4. **DevOps Agent**: Handles deployment, environment configuration, and monitoring
5. **Coordinator Agent**: Orchestrates the work of other agents and manages workflow dependencies

## Usage

1. Run the `activate-agents.sh` script to initialize and validate the agent system
2. Configure the appropriate agent using the files in `/configs`
3. Use the prompt templates in `/prompts` as a starting point for agent instructions
4. Customize workflow orchestration in `/workflows` to fit project requirements
5. Extend agent capabilities using tool definitions in `/tools`
6. Refer to the documentation in `/docs` for detailed usage guides

## Integration with Other Projects

To use these agents with other projects:

1. Adjust the project-specific paths and identifiers in the config files
2. Update API keys and environment variables as needed
3. Modify tool schemas to match project-specific requirements
4. Customize prompts to reflect project domain knowledge

## Monitoring and Management

Agent activity is logged and can be monitored through the standard monitoring interfaces. Performance metrics and completion rates are tracked automatically.

For emergency procedures and fallback mechanisms, refer to the respective agent's documentation in the `/prompts` directory.
