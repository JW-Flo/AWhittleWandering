# Testing Procedures

This document outlines the testing procedures and infrastructure for the A Whittle Wandering project.

## Testing Infrastructure

The testing infrastructure for this project consists of several integrated components:

- **Unit Tests**: For testing individual components and functions
- **Integration Tests**: For testing interactions between components
- **End-to-End Tests**: For testing complete user flows
- **Performance Tests**: For ensuring system responsiveness and reliability

## Running Tests

### Unit Tests

```bash
cd 48Continental_Starter/public-site
bun run test:unit
```

### Integration Tests

```bash
cd 48Continental_Starter/public-site
bun run test:integration
```

### End-to-End Tests

```bash
cd 48Continental_Starter/public-site
bun run test:e2e
```

### Performance Tests

```bash
cd 48Continental_Starter/public-site
bun run test:performance
```

### Running All Tests

```bash
cd 48Continental_Starter/public-site
bun run test:all
```

## Continuous Integration

Tests are automatically run in GitHub Actions on each push to the main branch. The workflow is defined in `.github/workflows/test.yml`.

## Test Coverage

We aim to maintain test coverage of at least 80% across the codebase. Coverage reports are generated after running tests and can be viewed at `coverage/lcov-report/index.html`.

## Testing Guidelines

### Writing Unit Tests

- Each component should have corresponding unit tests
- Test both success and failure paths
- Mock external dependencies

### Writing Integration Tests

- Focus on component interactions
- Test API integrations
- Test data flow between components

### Writing End-to-End Tests

- Cover critical user workflows
- Test on multiple screen sizes
- Include error scenarios and recovery

## Automated Test Reports

Test reports are automatically generated and stored in the `test-reports` directory. These reports include:

- Test results summary
- Performance metrics
- Coverage reports
- Browser compatibility reports

## Troubleshooting Tests

Common issues and their solutions:

1. **Mapbox Token Issues**: Ensure the Mapbox token is correctly set in the test environment.
2. **API Endpoint Mocking**: Make sure all API endpoints are properly mocked in tests.
3. **WebSocket Connections**: WebSocket connections should be mocked in tests to avoid hanging test processes.
4. **Browser Compatibility**: Run tests across multiple browsers to ensure cross-browser compatibility.
