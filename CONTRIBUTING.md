# Contributing to A Whittle Wandering

Thank you for your interest in contributing to the A Whittle Wandering project! This document provides guidelines and instructions for contributing.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Git
- A Cloudflare account (for deployment testing)

### Setting Up the Development Environment

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/your-username/AWhittleWandering.git
   cd AWhittleWandering
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your development credentials
   ```

4. **Start development servers**:
   ```bash
   # Terminal 1: Start the frontend
   npm run dev:site
   
   # Terminal 2: Start the edge worker
   npm run dev:edge
   ```

## 📝 Development Guidelines

### Code Style

- Follow existing TypeScript/JavaScript patterns
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Keep functions small and focused

### Testing

- Write tests for new functionality
- Ensure all existing tests pass: `npm test`
- Test edge cases and error conditions
- Update documentation for API changes

### Security

- **Never commit sensitive data** (API keys, tokens, passwords)
- Use environment variables for all credentials
- Follow the principle of least privilege
- Validate all inputs and sanitize outputs

## 🔄 Contribution Process

### For Bug Fixes

1. Create an issue describing the bug
2. Create a branch: `git checkout -b fix/issue-description`
3. Make your changes with tests
4. Submit a pull request

### For Features

1. Create an issue to discuss the feature
2. Wait for approval from maintainers
3. Create a branch: `git checkout -b feature/feature-name`
4. Implement the feature with tests and documentation
5. Submit a pull request

### Pull Request Guidelines

- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Include test results and how to verify the changes
- **Documentation**: Update relevant documentation
- **Breaking Changes**: Clearly mark any breaking changes

## 🗂️ Project Structure

Understanding the repository structure will help you contribute effectively:

```
├── 48Continental_Starter/public-site/  # React frontend
├── edge-worker/                        # Cloudflare Workers API
├── docs/                              # Project documentation
├── scripts/                           # Deployment and utility scripts
├── shared/                            # Shared utilities
└── tests/                             # Test files
```

## 🐛 Reporting Issues

When reporting issues, please include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, browser)
- **Screenshots** if applicable

## 📋 Development Tasks

Areas where contributions are especially welcome:

- **Testing**: Improve test coverage
- **Documentation**: Clarify setup instructions
- **Performance**: Optimize map loading and API calls
- **Accessibility**: Ensure compliance with web standards
- **Mobile**: Improve mobile responsiveness

## ⚡ Quick Commands

```bash
# Install all dependencies
npm run install:all

# Build everything
npm run build

# Run tests
npm test

# Start development servers
npm run dev:site    # Frontend on http://localhost:5173
npm run dev:edge    # Edge worker on http://localhost:8787

# Lint code
npm run lint
```

## 🤝 Community Guidelines

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Provide constructive feedback
- Keep discussions focused and professional

## 📞 Getting Help

- **Documentation**: Check the [docs/](docs/) directory
- **Issues**: Search existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately

## 🎯 Development Focus

This is a **live production system** tracking a real road trip, so:

- **Stability is critical** - avoid breaking changes
- **Performance matters** - optimize for real-time updates  
- **Security is paramount** - protect sensitive vehicle data
- **User experience counts** - maintain smooth map interactions

Thank you for contributing to A Whittle Wandering! 🚗💨