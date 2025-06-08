# Using AI Agents for "A Whittle Wandering" Project

This guide explains how to effectively use the AI agents configured for the "A Whittle Wandering" project. These agents are designed to accelerate development, maintain code quality, and ensure project features are implemented according to requirements.

## Agent System Overview

The project uses a system of specialized AI agents, each focused on specific aspects of the development process:

1. **Map Integration Agent**: Focuses on Mapbox integration, route visualization, and map performance
2. **Weather Integration Agent**: Handles weather data integration and weather-aware route planning
3. **UI/UX Enhancement Agent**: Works on timeline controls, mobile optimization, and user interface
4. **DevOps Agent**: Manages environment setup, token management, and deployment processes
5. **Coordinator Agent**: Orchestrates the work of other agents and manages dependencies

## Getting Started

### Prerequisites

1. Install GitHub Copilot and Copilot Chat extensions in VS Code
2. Configure environment variables as specified in `settings/environment-config.json`
3. Install recommended VS Code extensions listed in `settings/vscode-settings.json`

### Setting Up Agent Environment

1. Clone the repository and navigate to the project root
2. Run the environment setup script:
   ```bash
   ./scripts/setup-agent-environment.sh
   ```
3. Verify your environment variables are properly configured:
   ```bash
   ./scripts/verify-agent-environment.sh
   ```

## Using Individual Agents

### Map Integration Agent

**When to use:**
- Implementing or optimizing map components
- Adding route visualization features
- Improving map performance
- Integrating points of interest

**How to prompt:**
```
@map-agent I need to implement a route visualization that shows the current vehicle position with an animated marker and displays the planned route with weather conditions highlighted.
```

### Weather Integration Agent

**When to use:**
- Integrating weather API data
- Creating weather visualization overlays
- Implementing weather-aware route planning
- Optimizing weather data caching

**How to prompt:**
```
@weather-agent I need to create a weather overlay that shows precipitation probability along the route for the next 6 hours.
```

### UI/UX Enhancement Agent

**When to use:**
- Implementing timeline controls
- Optimizing mobile user experience
- Creating responsive layouts
- Implementing accessibility features

**How to prompt:**
```
@ui-agent I need to create a responsive timeline control that allows users to scrub through the journey history and updates the map position accordingly.
```

### DevOps Agent

**When to use:**
- Setting up deployment environments
- Managing API tokens and credentials
- Configuring build processes
- Implementing monitoring systems

**How to prompt:**
```
@devops-agent I need to update the edge worker deployment process to include automated testing before deployment to production.
```

### Coordinator Agent

**When to use:**
- Planning development sprints
- Managing dependencies between components
- Resolving blockers across teams
- Tracking project progress

**How to prompt:**
```
@coordinator-agent I need to plan the next development sprint focusing on the map performance optimization while ensuring the weather integration work can proceed in parallel.
```

## Using Multiple Agents Together

For complex tasks requiring multiple areas of expertise, you can involve multiple agents:

```
@coordinator-agent I need to implement a feature where the user can see weather conditions along their route and the map automatically suggests alternative routes to avoid severe weather. This will require map integration, weather data, and UI components.
```

## Best Practices

1. **Be specific in your requests** - Provide clear context and desired outcomes
2. **Start with the coordinator for complex tasks** - Let it break down work for specialized agents
3. **Provide feedback on agent output** - Help improve future responses
4. **Reference documentation** - Point agents to specific documentation when needed
5. **Review generated code** - Always validate and test code before committing

## Troubleshooting

### Agent Not Responding as Expected

1. Check that your prompt is clear and specific
2. Verify that required environment variables are set
3. Ensure you're using the correct agent for the task
4. Try rephrasing your request with more context

### Integration Issues Between Agent Outputs

1. Use the coordinator agent to resolve conflicts
2. Ensure each agent has access to relevant context
3. Manually reconcile conflicting approaches if needed

## Extending the Agent System

See the [MCP Configuration Guide](./mcp-configuration.md) for details on how to extend or modify agent capabilities.

## Contact

For issues with the agent system, contact the project maintainers.
