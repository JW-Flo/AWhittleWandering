# Contributing to A Whittle Wandering

Thank you for your interest in contributing to A Whittle Wandering! This project tracks a Tesla vehicle on a 60-day journey across all 48 contiguous United States, providing real-time updates and an immersive experience for users following the journey.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Project Structure](#project-structure)
- [Security](#security)

## Code of Conduct

This project and everyone participating in it is governed by our commitment to creating a welcoming and respectful environment. By participating, you are expected to uphold this standard.

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Git
- A Cloudflare account (for edge worker deployment)
- Basic knowledge of React, TypeScript, and REST APIs

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JW-Flo/AWhittleWandering.git
   cd AWhittleWandering
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers:**
   ```bash
   # Frontend development server
   cd 48Continental_Starter/public-site
   npm run dev
   
   # Edge worker development server
   cd ../../edge-worker
   npm run dev
   ```

## Making Changes

### Before You Start

1. Check existing issues and pull requests to avoid duplication
2. Create an issue to discuss significant changes
3. Fork the repository and create a feature branch

### Branch Naming Convention

- `feature/description` - for new features
- `fix/description` - for bug fixes
- `docs/description` - for documentation updates
- `chore/description` - for maintenance tasks

### Coding Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the existing ESLint configuration
- **Formatting**: Use Prettier for code formatting
- **Comments**: Include JSDoc comments for functions and complex logic
- **Error Handling**: Implement comprehensive error handling and logging
- **Performance**: Consider mobile device performance in all implementations

### Code Style Guidelines

```typescript
// ✅ Good: Include JSDoc comments
/**
 * Fetches current vehicle telemetry data
 * @param vehicleId - The Tesla vehicle identifier
 * @returns Promise containing telemetry data
 */
async function getVehicleTelemetry(vehicleId: string): Promise<TelemetryData> {
  try {
    // Implementation with proper error handling
    return await fetchTelemetryData(vehicleId);
  } catch (error) {
    logger.error('Failed to fetch telemetry', { vehicleId, error });
    throw new TelemetryError('Unable to retrieve vehicle data');
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run API endpoint tests
node scripts/test-api-endpoints.js

# Run component tests
cd awhittlewandering
npx vitest run tests/components/

# Verify Mapbox integration
cd 48Continental_Starter/public-site
./scripts/verify-mapbox-token.sh
```

### Test Requirements

- **Unit Tests**: Required for all new functions
- **Integration Tests**: Required for API endpoints
- **Component Tests**: Required for React components
- **End-to-End Tests**: Required for critical user paths

### Writing Tests

```typescript
// Example test structure
import { describe, it, expect, vi } from 'vitest';
import { getVehicleTelemetry } from '../src/telemetry';

describe('Vehicle Telemetry', () => {
  it('should fetch telemetry data successfully', async () => {
    // Arrange
    const mockData = { lat: 40.7128, lng: -74.0060, battery: 85 };
    vi.mocked(fetchTelemetryData).mockResolvedValue(mockData);

    // Act
    const result = await getVehicleTelemetry('test-vehicle-id');

    // Assert
    expect(result).toEqual(mockData);
  });
});
```

## Submitting Changes

### Pull Request Process

1. **Update your branch:**
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run tests and linting:**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

3. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: add vehicle tracking enhancement"
   ```

4. **Push and create PR:**
   ```bash
   git push origin your-feature-branch
   ```

### Pull Request Guidelines

- **Title**: Use conventional commit format (`feat:`, `fix:`, `docs:`, etc.)
- **Description**: 
  - Clearly describe what changes were made
  - Link to related issues
  - Include screenshots for UI changes
  - List any breaking changes
- **Testing**: Confirm all tests pass
- **Documentation**: Update documentation if needed

### PR Template Example

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] All tests pass
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Screenshots (if applicable)

## Related Issues
Closes #123
```

## Project Structure

```
├── 48Continental_Starter/     # Legacy frontend structure
│   └── public-site/           # React frontend application
├── awhittlewandering/         # New consolidated codebase
│   ├── packages/
│   │   └── frontend/          # Modern React application
│   ├── tests/                 # Test suites
│   └── workers/               # Cloudflare Workers
├── edge-worker/               # Edge Worker API implementation
├── mcp-server/                # MCP server implementation
├── n8n/                       # n8n workflows for automation
├── shared/                    # Shared utilities and services
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Project documentation
└── .github/                   # GitHub Actions workflows
```

### Key Components

- **Frontend**: React-based user interface with real-time map
- **Edge Worker**: Cloudflare Workers API for data processing
- **MCP Server**: Mission Control Platform running on persistent hardware
- **Vehicle Integration**: Tesla API integration via Tessie
- **Weather Service**: Real-time weather data integration

## Security

### Sensitive Data Handling

- **Never commit API keys or secrets** to the repository
- Use environment variables for all sensitive configuration
- Reference the `.env.example` file for required variables
- Use Cloudflare secrets for production deployments

### Environment Variables

Required environment variables:
```bash
CF_API_TOKEN=your_cloudflare_api_token
CF_ACCOUNT_ID=your_cloudflare_account_id
TESSIE_API_TOKEN=your_tessie_api_token
TESSIE_VIN=your_tesla_vehicle_id
OPENWEATHER_API_KEY=your_openweather_api_key
MAPBOX_TOKEN=your_mapbox_token
EDGE_HMAC_KEY=your_edge_hmac_key
```

### Reporting Security Issues

If you discover a security vulnerability, please email the maintainers directly rather than opening a public issue.

## Getting Help

- **Issues**: Create an issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for questions
- **Documentation**: Check the `/docs` directory for detailed guides

Thank you for contributing to A Whittle Wandering! 🚗✨