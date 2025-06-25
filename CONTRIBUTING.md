# Contributing to A Whittle Wandering

Thank you for your interest in contributing to the A Whittle Wandering project! This guide will help you get started with contributing to our real-time Tesla road trip tracking system.

## Project Overview

A Whittle Wandering is a comprehensive system tracking a 60-day Tesla road trip through all 48 contiguous U.S. states. The project consists of:

- **Edge Workers**: Cloudflare Workers handling API endpoints and real-time data
- **Frontend Applications**: React-based web interfaces for trip visualization
- **MCP Server**: Mission Control Platform for system coordination
- **Mobile App**: iOS application for trip tracking
- **Shared Libraries**: Common utilities and services

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- A code editor (VS Code recommended)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/JW-Flo/AWhittleWandering.git
   cd AWhittleWandering
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials (never commit these!)
   ```

4. **Choose your development area**
   - **Edge Worker**: `cd edge-worker`
   - **Frontend**: `cd awhittlewandering/packages/frontend`
   - **MCP Server**: `cd mcp-server`

## Development Guidelines

### Code Style

- Use TypeScript where possible
- Follow existing naming conventions
- Use async/await for asynchronous operations
- Include comprehensive error handling
- Add JSDoc comments for functions
- Follow the project's ESLint configuration

### Testing

- Write unit tests for new functions
- Add integration tests for API endpoints
- Ensure tests pass before submitting PRs
- Use the existing test patterns and utilities

### Documentation

- Update README files when adding new features
- Include code comments for complex logic
- Document API endpoints and data structures
- Update this contributing guide if needed

## Contribution Process

### Before You Start

1. **Check existing issues** to see if your idea is already being worked on
2. **Create an issue** for new features or bug reports
3. **Discuss your approach** in the issue before starting significant work

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the coding standards
   - Write tests for new functionality
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run lint
   npm test
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```
   
   Use conventional commit messages:
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `test:` for test additions
   - `refactor:` for code refactoring

5. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Pull Request Guidelines

- **Clear title and description** explaining what changes you made
- **Link to related issues** using "Fixes #issue-number"
- **Include test coverage** for new functionality
- **Update documentation** if you're changing APIs or adding features
- **Keep PRs focused** - one feature or fix per PR
- **Respond to feedback** promptly and professionally

## Architecture Notes

### Directory Structure

```
├── awhittlewandering/         # New consolidated codebase
├── edge-worker/               # Cloudflare Workers
├── mcp-server/                # MCP server implementation
├── shared/                    # Shared utilities and services
├── scripts/                   # Deployment and utility scripts
├── docs/                      # Project documentation
└── .github/                   # GitHub Actions workflows
```

### Key Technologies

- **Frontend**: React, TypeScript, Vite
- **Backend**: Cloudflare Workers, TypeScript
- **Database**: Cloudflare KV, R2
- **Maps**: Mapbox GL JS
- **Telemetry**: Tessie API for Tesla data
- **CI/CD**: GitHub Actions

### Environment Variables

Never commit actual API keys or credentials. Always use the `.env.example` pattern and update documentation when adding new environment variables.

## Reporting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Use clear, descriptive titles**
3. **Include steps to reproduce** for bugs
4. **Provide context** about your use case
5. **Include relevant logs or screenshots**

## Questions and Support

- **Documentation**: Check the `docs/` directory first
- **Issues**: Create a GitHub issue for bugs or feature requests
- **Discussions**: Use GitHub Discussions for general questions
- **Code Review**: Tag maintainers in PRs for review

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and improve
- Follow the project's technical standards
- Report any inappropriate behavior

## License

By contributing to A Whittle Wandering, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to our journey across America! 🚗⚡