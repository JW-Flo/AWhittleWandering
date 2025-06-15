# A Whittle Wandering: Test Suite

This directory contains automated tests for the A Whittle Wandering project, ensuring that data integration between different components (API, vehicle telemetry, weather, itinerary) works correctly and provides an immersive experience.

## Test Structure

The tests are organized into the following directories:

- `api/`: Tests for API endpoints
- `components/`: Tests for React hooks and components

## Running Tests

You can run all tests using the automated script:

```bash
./scripts/run-api-tests.sh
```

Or run individual test files using Vitest:

```bash
# Run API endpoint tests
npx vitest run tests/api/current-trip.test.ts

# Run React hook tests
npx vitest run tests/components/useVehicleData.test.tsx
```

## Continuous Integration

Tests automatically run on GitHub Actions for every push to the main and develop branches. The workflow is defined in `.github/workflows/integration-tests.yml`.

## Test Coverage

### API Tests

- `current-trip.test.ts`: Tests the `/api/trip/current` endpoint
  - Verifies the endpoint returns current vehicle location and telemetry
  - Tests error handling when data is unavailable
  - Tests handling of network errors

### Component Tests

- `useVehicleData.test.tsx`: Tests the React hook for fetching and processing vehicle data
  - Verifies that telemetry data is loaded correctly
  - Tests error handling when API calls fail
  - Ensures that loading states are properly managed

## Data Integration Testing Strategy

Our testing strategy focuses on ensuring seamless data integration across three key areas:

1. **Live Vehicle Telemetry**: Tests verify that real-time vehicle data (location, battery level, speed, etc.) is accurately fetched and displayed.

2. **Itinerary Information**: Tests confirm that trip itinerary details are properly integrated with the map display.

3. **Weather Data**: Tests validate that weather information is correctly overlaid when toggled.

The tests use mocked API responses to simulate various scenarios, ensuring that the application can handle both successful and error cases.

## Adding New Tests

When adding new tests, follow these guidelines:

1. Place API endpoint tests in the `api/` directory
2. Place React component tests in the `components/` directory
3. Use the test setup files for common test utilities
4. Mock API responses to test both success and error cases
5. Update the automated test script to include your new tests

## Test Reports

Test reports are automatically generated in the project root directory with the naming format `test-report-{timestamp}.txt`. These reports are also uploaded as artifacts in GitHub Actions runs.
