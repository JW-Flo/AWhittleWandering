# Development Guide

## Overview

This guide covers the development setup, testing strategy, and failure tracking system for the Wandering Whittle project.

## Version Requirements

### Required Software Versions

- **Node.js**: >= 22.16.0 (LTS)
- **npm**: >= 10.0.0
- **Wrangler CLI**: >= 4.19.0

### Why These Versions?

- **Node.js 22**: Latest LTS with improved performance and security
- **npm 10**: Includes latest security fixes and performance improvements
- **Wrangler 4.19**: Latest stable version with Cloudflare Workers support

## Test Failure Tracking System

### Philosophy: Real Data Over Mocks

We prioritize testing with real data to catch actual integration issues rather than relying solely on mocks.

### Test Scripts

1. **Standard Tests**: `npm test`
   - Uses mocks for fast feedback
   - Good for unit testing and basic functionality

2. **Real Data Tests**: `npm run test:real-data`
   - Uses actual API calls and real data
   - Catches integration issues
   - Slower but more reliable

3. **Failure Analysis**: `npm run test:analyze`
   - Analyzes test results and generates reports
   - Creates actionable failure summaries

### Failure Tracking Workflow

1. **Run Tests**: Execute `npm run test:real-data`
2. **Capture Failures**: System automatically captures failures to `test-results/`
3. **Analyze**: Review `test-results/LATEST_FAILURES.md` for summary
4. **Fix Issues**: Address real data integration problems
5. **Iterate**: Re-run tests to verify fixes

### Test Results Structure

```
test-results/
├── LATEST_FAILURES.md          # Human-readable summary
├── latest-summary.txt          # Console-friendly summary
├── failure-report-*.json       # Detailed failure data
└── test-results.json          # Raw test output
```

## Environment Configuration

### Required Environment Variables

```bash
# Core Configuration
VITE_MAPBOX_TOKEN=your_mapbox_token_here
CF_ACCOUNT_ID=your_cloudflare_account_id
CF_API_TOKEN=your_cloudflare_api_token

# Feature Flags
VITE_USE_REAL_DATA=true
VITE_ENABLE_STREAMING=true

# Development
VITE_DEBUG=false
VITE_LOG_LEVEL=info
```

### Getting API Keys

1. **Mapbox Token**:
   - Visit: https://account.mapbox.com/access-tokens/
   - Create a new token with appropriate scopes

2. **Cloudflare Credentials**:
   - Visit: https://dash.cloudflare.com/profile/api-tokens
   - Create token with Workers:Edit permissions

## Development Workflow

### Initial Setup

```bash
# Option 1: Automated setup
npm run setup

# Option 2: Manual setup
nvm use 22
npm install
cp .env.example .env
# Edit .env with your values
```

### Daily Development

```bash
# Start development server
npm run dev

# Run tests (fast feedback)
npm test

# Run comprehensive tests with real data
npm run test:real-data

# Build for production
npm run build

# Deploy to Cloudflare
npm run deploy
```

### Debugging Test Failures

1. **Check Test Results**:
   ```bash
   cat test-results/LATEST_FAILURES.md
   ```

2. **Run Specific Tests**:
   ```bash
   npm test -- --grep "specific test name"
   ```

3. **Enable Debug Mode**:
   ```bash
   VITE_DEBUG=true npm run test:real-data
   ```

## Best Practices

### Testing

- Always run real data tests before deploying
- Review failure reports to understand integration issues
- Use mocks for unit tests, real data for integration tests
- Keep test data current and representative

### Version Management

- Use `.nvmrc` for consistent Node.js versions
- Pin dependency versions in `package.json`
- Update versions systematically, not ad-hoc

### Environment Management

- Never commit `.env` files
- Keep `.env.example` updated
- Use different environments for different stages

## Troubleshooting

### Common Issues

1. **Node Version Mismatch**:
   ```bash
   nvm use 22
   ```

2. **Wrangler Authentication**:
   ```bash
   wrangler login
   ```

3. **Port Already in Use**:
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

4. **Test Failures with Real Data**:
   - Check API credentials in `.env`
   - Verify network connectivity
   - Review rate limiting

### Getting Help

1. Check `test-results/LATEST_FAILURES.md` for specific errors
2. Review environment configuration
3. Verify all required software versions
4. Check network connectivity for real data tests

## Continuous Integration

The project includes GitHub Actions workflows that:
- Verify Node.js version requirements
- Run both mock and real data tests
- Deploy to Cloudflare on successful tests
- Generate failure reports for debugging

See `.github/workflows/` for specific configurations.
