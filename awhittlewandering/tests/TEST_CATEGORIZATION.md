# Test Categorization for AWhittleWandering

This document outlines the test categorization strategy to optimize deployment pipeline performance.

## Test Categories

### 1. Critical Tests (`tests/critical/`)
**Purpose**: Essential tests that must pass before any deployment
**Execution**: Pre-deployment, blocks deployment on failure
**Max Runtime**: 2 minutes
**Includes**:
- Core API endpoint functionality
- Basic data validation
- Security checks
- Performance baseline tests

### 2. API Tests (`tests/api/`)
**Purpose**: Comprehensive API endpoint testing
**Execution**: Can run in parallel with build process
**Max Runtime**: 5 minutes
**Includes**:
- All API endpoint tests
- Error handling scenarios
- Data validation
- Response format verification

### 3. Component Tests (`tests/components/`)
**Purpose**: Frontend component functionality
**Execution**: Can run in parallel with deployment
**Max Runtime**: 3 minutes
**Includes**:
- React hook tests
- Component integration tests
- UI state management

### 4. Integration Tests (`tests/integration/`)
**Purpose**: End-to-end feature testing
**Execution**: Post-deployment or parallel
**Max Runtime**: 10 minutes
**Includes**:
- Full user journey tests
- Cross-component integration
- Data flow validation

### 5. Post-Deploy Tests (`tests/post-deploy/`)
**Purpose**: Validation of live deployment
**Execution**: After deployment completion
**Max Runtime**: 15 minutes
**Includes**:
- Live endpoint validation
- Performance monitoring
- User acceptance scenarios
- Load testing

## Test Execution Strategy

1. **Pre-deployment**: Only critical tests run and block deployment
2. **During deployment**: API and component tests run in parallel
3. **Post-deployment**: Integration and post-deploy tests validate live system
4. **Failure handling**: Non-critical test failures are logged but don't block deployment

## Feature Flags Integration

Tests include feature flag validation to ensure:
- Staged rollouts work correctly
- Feature toggles are respected
- Gradual deployment scenarios are tested