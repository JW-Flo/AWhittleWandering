# GitHub Copilot Instructions for 48 Continental Project

## Project Context

This is a real-time, multi-system initiative tracking a 60-day Tesla road trip through all 48 contiguous U.S. states. The system consists of:

- Local MCP (Mission Control Platform) server
- Onboard vehicle tracker
- Edge infrastructure (Cloudflare Workers)
- Public-facing website

## Core Principles

1. Treat all operations as live production systems
2. Prioritize real-time data consistency across all components
3. Implement robust fallback mechanisms
4. Maintain strict error handling and logging
5. Ensure cross-system synchronization

## Code Generation Guidelines

### General Requirements

- Include comprehensive error handling
- Add detailed logging statements
- Implement retry mechanisms for network operations
- Include JSDoc comments for all functions
- Follow TypeScript best practices
- Use async/await for asynchronous operations

### Vehicle Tracking

- Always implement watchdog timers for data streams
- Include data validation for GPS coordinates
- Handle intermittent connectivity scenarios
- Buffer telemetry data locally when needed
- Implement reconnection logic

### Map Integration

- Validate all coordinate data
- Handle map loading states gracefully
- Implement zoom level optimizations
- Cache tile data appropriately
- Consider mobile device performance

### Edge Infrastructure

- Include CORS headers in all responses
- Implement rate limiting
- Add cache control headers
- Handle WebSocket reconnection gracefully
- Validate all API parameters

### Testing Requirements

- Include unit tests for new functions
- Add integration tests for API endpoints
- Implement end-to-end tests for critical paths
- Add performance benchmarks
- Include accessibility tests

## System Integration

### MCP Server Integration

```typescript
// Example pattern for MCP server interaction
interface MCPOperation {
  operation: string;
  timestamp: number;
  data: unknown;
  retryCount?: number;
  maxRetries?: number;
}

async function handleMCPOperation(op: MCPOperation): Promise<void> {
  try {
    // Validation
    // Operation execution
    // Result verification
  } catch (error) {
    // Error handling
    // Retry logic
    // Fallback mechanism
  }
}
```

### Telemetry Handling

```typescript
// Example pattern for telemetry data
interface TelemetryPacket {
  vehicleId: string;
  timestamp: number;
  position: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
  metrics: {
    batteryLevel: number;
    speed: number;
    temperature: number;
  };
}

function validateTelemetryPacket(packet: TelemetryPacket): boolean {
  // Implement validation logic
}
```

## Error Handling Template

```typescript
try {
  // Main operation
} catch (error) {
  // Log error details
  logger.error({
    message: "Operation failed",
    operation: "OperationName",
    error: error.message,
    stack: error.stack,
    context: {
      // Additional context
    },
  });

  // Implement fallback
  await fallbackMechanism();

  // Notify monitoring systems
  await alertMonitoring(error);
}
```

## Documentation Requirements

- Include a clear description of the function's purpose
- List all parameters and return types
- Document potential errors and how they're handled
- Provide usage examples
- Note any performance considerations

## Security Considerations

- Validate all input data
- Implement rate limiting where appropriate
- Use environment variables for sensitive data
- Follow HTTPS-only practices
- Implement proper authentication checks

## Performance Guidelines

- Implement caching where appropriate
- Use pagination for large datasets
- Optimize database queries
- Implement request batching
- Consider memory usage in data processing

## Monitoring Integration

- Add performance metrics
- Include error tracking
- Implement health checks
- Add usage analytics
- Monitor resource utilization
