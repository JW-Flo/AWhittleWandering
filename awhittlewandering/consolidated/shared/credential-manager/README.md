# Security Credential Manager

A robust, multi-source credential management system for the 48 Continental project. This module provides a unified interface for securely accessing credentials across the distributed system.

## Features

- **Multi-Source Credential Retrieval**: Primary access through 1Password Connect API with configurable fallbacks
- **Criticality-Based Handling**: Different behavior for critical vs. non-critical credentials
- **Comprehensive Audit Logging**: Track all credential access, success, and failures
- **Fallback Chain**: Graceful degradation through multiple credential sources
- **Integration Ready**: Designed to work with MCP Orchestrator and API Manager

## Installation

```bash
cd shared/credential-manager
bun install
bun run build
```

## Configuration

Create a `.env` file based on the provided `.env.example`:

```bash
cp .env.example .env
# Edit the .env file with your credentials
```

The credential manager requires the following environment variables:

- `ONEPASSWORD_CONNECT_URL`: URL of your 1Password Connect server
- `ONEPASSWORD_VAULT_ID`: ID of the vault containing credentials
- `ONEPASSWORD_CONNECT_TOKEN`: Authentication token for 1Password Connect

Optional configuration:

- Secondary vault details (for fallback)
- Logging configuration
- Alert settings for missing credentials

## Usage

### Basic Usage

```typescript
import { CredentialManager, OnePasswordSource, EnvSource } from '@48continental/credential-manager';

// Create credential sources in priority order
const sources = [
  new OnePasswordSource(
    process.env.ONEPASSWORD_CONNECT_URL!, 
    process.env.ONEPASSWORD_VAULT_ID!, 
    process.env.ONEPASSWORD_CONNECT_TOKEN!
  ),
  new EnvSource()
];

// Initialize the credential manager
const credentialManager = new CredentialManager(sources);

// Get a credential (with criticality)
async function getApiKey() {
  const apiKey = await credentialManager.getCredential('TESLA_API_KEY', 'critical');
  if (!apiKey) {
    // Handle missing credential
    console.error('Failed to retrieve Tesla API key');
    process.exit(1);
  }
  return apiKey;
}
```

### Integration with API Manager

```typescript
import { CredentialManager } from '@48continental/credential-manager';
import { ApiClient } from './api-client';

class TeslaApiWrapper {
  constructor(
    private credentialManager: CredentialManager,
    private baseUrl = 'https://owner-api.teslamotors.com/api/1'
  ) {}

  async getVehicleData(vehicleId: string) {
    // Get credentials just before use
    const apiKey = await this.credentialManager.getCredential('TESLA_API_KEY', 'critical');
    const accessToken = await this.credentialManager.getCredential('TESLA_ACCESS_TOKEN', 'critical');
    
    if (!apiKey || !accessToken) {
      throw new Error('Missing Tesla API credentials');
    }

    const client = new ApiClient({
      baseUrl: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Tesla-API-Key': apiKey
      }
    });

    return client.get(`/vehicles/${vehicleId}/data`);
  }
}
```

### Integration with MCP Orchestrator

```typescript
import { CredentialManager } from '@48continental/credential-manager';
import { MCPOrchestrator } from './mcp-orchestrator';

async function setupMCP() {
  const credentialManager = new CredentialManager([/* sources */]);
  
  // Initialize MCP with credential manager
  const mcp = new MCPOrchestrator({
    credentialManager,
    // other config
  });

  // Register the credential manager as an agent
  mcp.registerAgent('credential-manager', {
    getCredential: async (key, criticality) => {
      return credentialManager.getCredential(key, criticality);
    }
  });

  return mcp;
}
```

## Credential Storage Guidelines

For the 48 Continental project, store credentials in the following locations:

1. **1Password Vault (Primary)**: All API keys, tokens, certificates
2. **Environment Variables (Fallback)**: Non-sensitive configuration values
3. **GitHub Secrets (CI/CD)**: Deployment tokens, workflow credentials

DO NOT store credentials in:

- Source code or configuration files
- Unencrypted local files
- Shared storage without access control

## Credential Criticality Levels

- **Critical**: System cannot function without this credential (e.g., Tesla API keys)
- **Important**: Reduces functionality but core features work (e.g., weather API keys)
- **Optional**: Nice-to-have, non-essential (e.g., analytics tokens)

## Handling Missing Credentials

The credential manager handles missing credentials based on their criticality:

- **Critical**: Alerts human operators, logs detailed diagnostics, may terminate process
- **Important**: Logs warnings, continues with reduced functionality
- **Optional**: Logs info message, disables related feature

## Implementing Custom Credential Sources

You can create custom credential sources by implementing the `CredentialSource` interface:

```typescript
import { CredentialSource } from '@48continental/credential-manager';

class CustomSource implements CredentialSource {
  name = 'Custom Source';
  
  async getCredential(key: string): Promise<string | null> {
    // Your implementation here
    return someValue || null;
  }
}
```

## Security Considerations

- All credential access is logged for audit purposes
- Credentials are never cached in memory longer than needed
- API keys are requested just-in-time, immediately before use
- Fallback mechanisms ensure system resilience without compromising security

## Development

To run tests:

```bash
npm test
```

To build:

```bash
bun run build
