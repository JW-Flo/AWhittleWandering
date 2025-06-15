# A Whittle Wandering: Testing Infrastructure

This document provides an overview of the testing infrastructure for the A Whittle Wandering project. The testing infrastructure has been designed to ensure data reliability and system integrity throughout the 60-day journey.

## Overview

The testing infrastructure consists of multiple layers of testing:

1. **API Tests**: Verify that the API endpoints are functioning correctly
2. **Component Tests**: Ensure that React components and hooks integrate properly with the API
3. **Continuous Integration**: Automatically run tests on every code change

## Test Structure

```
awhittlewandering/
├── tests/
│   ├── README.md           # Documentation for test suite
│   ├── api/                # API endpoint tests
│   │   ├── setup.ts        # Common setup for API tests
│   │   └── current-trip.test.ts  # Tests for current trip endpoint
│   └── components/         # Frontend component tests
│       └── useVehicleData.test.tsx  # Tests for vehicle data hook
├── scripts/
│   └── run-api-tests.sh    # Script to run all tests
└── .github/
    └── workflows/
        └── integration-tests.yml  # CI workflow
```

## Running Tests

Tests can be run manually using the `run-api-tests.sh` script:

```bash
cd awhittlewandering
./scripts/run-api-tests.sh
```

This script:
1. Checks for dependency issues
2. Runs API endpoint tests
3. Runs component tests
4. Generates a test report

## Mock Data Strategy

The tests use mock data to simulate various scenarios:

- `setup.ts` provides mock Cloudflare KV, R2, and environment objects
- Test files contain sample telemetry and itinerary data
- API responses are mocked for consistent testing

This approach allows us to test edge cases and error scenarios without relying on actual vehicle telemetry or external services.

## Continuous Integration

The GitHub Actions workflow (`integration-tests.yml`) automatically runs all tests on:
- Every push to the main and develop branches
- Every pull request to these branches
- Manual triggers

Test reports are generated and uploaded as artifacts for later inspection.

## Test Coverage

Current test coverage includes:

### API Endpoints
- `/api/trip/current`: Current vehicle location and telemetry
- `/api/trip/day/:day`: (Planned)
- `/api/summary/:day`: (Planned)

### Frontend Components
- `useVehicleData` hook: Vehicle telemetry data fetching and processing
- `useTripData` hook: (Planned)
- Map component: (Planned)

## Future Improvements

The testing infrastructure is designed to be extensible. Planned improvements include:

1. Adding tests for weather data integration
2. Implementing end-to-end tests for critical user journeys
3. Adding tests for social media sharing functionality
4. Expanding API endpoint test coverage
5. Adding performance tests for map rendering

## Best Practices

When adding new tests:

1. Use the existing patterns and utilities
2. Ensure tests are deterministic (not dependent on external services)
3. Test both success and error cases
4. Update the documentation
5. Add the test to the automation script

## Troubleshooting

Common issues:

- **Type errors**: Ensure React and testing-library types are correctly imported
- **Missing dependencies**: Run `npm install --legacy-peer-deps` if needed
- **Failed tests**: Check the test report for detailed error information

## Conclusion

This testing infrastructure ensures the reliability of the A Whittle Wandering project during the 60-day journey. By automatically testing API endpoints, components, and data integration, we can confidently make changes to the codebase without risking disruption to the live tracking experience.
