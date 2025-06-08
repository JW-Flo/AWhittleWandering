# Model Context Protocol Configuration

This document outlines the structure and purpose of MCP (Model Context Protocol) configurations used by the AI agents in the "A Whittle Wandering" project.

## Overview

The Model Context Protocol defines how AI agents interact with the project's codebase, tools, and each other. Each agent has a specialized MCP configuration that defines its capabilities, access to tools, and interfaces for communication.

## Configuration Structure

Each MCP configuration file follows this general structure:

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "description": "Agent purpose description",
  "modelConfig": {
    "model": "model-name",
    "temperature": 0.0-1.0,
    "maxTokens": number
  },
  "promptFiles": [
    "path/to/prompt/file"
  ],
  "tools": [
    {
      "name": "tool-name",
      "description": "Tool description",
      "schema": {
        // JSON schema defining tool interface
      }
    }
  ],
  "requiredCredentials": [
    {
      "name": "CREDENTIAL_NAME",
      "description": "Credential description",
      "envVariable": "ENV_VARIABLE_NAME"
    }
  ],
  "dependencies": [
    {
      "agent": "dependent-agent-name",
      "description": "Dependency reason description"
    }
  ],
  "outputFormats": [
    {
      "name": "format-name",
      "description": "Output format description",
      "schema": {
        // JSON schema defining output format
      }
    }
  ]
}
```

## Key Components

### Model Configuration

The `modelConfig` section defines the LLM parameters:

- `model`: The specific model to use (e.g., "gpt-4")
- `temperature`: Controls randomness (0.0-1.0)
- `maxTokens`: Maximum output token length

### Prompt Files

References to markdown files containing the agent's role description, constraints, and instructions.

### Tools

Defines the tools available to the agent:

- `name`: Unique identifier for the tool
- `description`: Human-readable description
- `schema`: JSON schema defining input parameters and structure

### Required Credentials

Lists access credentials needed by the agent:

- `name`: Name of the credential
- `description`: Purpose of the credential
- `envVariable`: Environment variable name

### Dependencies

Lists other agents this agent depends on:

- `agent`: Name of the dependent agent
- `description`: Reason for the dependency

### Output Formats

Defines standardized output structures:

- `name`: Format identifier
- `description`: Purpose of the format
- `schema`: JSON schema defining output structure

## Agent Communication

Agents communicate through standardized output formats defined in their MCP configurations. The coordinator agent manages dependencies and ensures proper sequencing of agent activities.

## Extending the Configuration

To add new capabilities:

1. Define new tools in the `tools` section
2. Add new output formats in the `outputFormats` section
3. Update dependent agents' configurations to reference new capabilities
4. Modify prompt files to instruct the agent on using new capabilities

## Version Control

MCP configurations are versioned to track changes. When modifying an agent's capabilities, increment the version number and document changes.

## Testing

Changes to MCP configurations should be tested by:

1. Validating JSON schema correctness
2. Running the agent with test scenarios
3. Verifying output formats match expected schemas
4. Checking interactions with dependent agents
