# BlackBox Prompt for ContinentalUSA Project (Without GPU)

## Objective

Create a robust, real-time data streaming and analytics system for a cross-country trip across the continental USA. The system must integrate vehicle telemetry, weather data, and trip statistics into a unified, efficient, and reliable platform.

## Key Features and Requirements

1. **Real-Time Streaming API Endpoint**

   - Develop a push-based streaming REST API endpoint that streams vehicle telemetry, weather updates, and trip statistics.
   - Ensure the API supports WebSocket or Server-Sent Events (SSE) for efficient real-time data delivery.
   - Implement robust error handling, reconnection logic, and fallback mechanisms.

2. **Vehicle Telemetry Integration**

   - Use the Tessie API for vehicle telemetry data.
   - Fix existing telemetry schema issues and extend it to include additional relevant data points.
   - Implement authentication using rotating OAuth tokens as per Tessie API specifications.
   - Ensure rate limiting and caching strategies to optimize API usage.

3. **Weather Data Integration**

   - Integrate a nested weather object into the telemetry data stream.
   - Use existing weather API integrations and update the UI components accordingly.
   - Optimize for mobile and low-bandwidth connections.

4. **AI-Enhanced Analytics**

   - Implement AI-driven analytics on the streaming data to provide insights and predictions.
   - Use existing AI worker infrastructure for processing and analysis.
   - Ensure analytics results are streamed back to clients in real-time.

5. **Deployment and Monitoring**

   - Follow the documented deployment strategy for edge workers, MCP server, public website, and mobile apps.
   - Implement automated verification and rollback procedures.
   - Set up monitoring and alerting for all components.

6. **Security and Compliance**

   - Store all secrets in environment variables; never commit them to source control.
   - Sanitize and validate all incoming and outgoing data.
   - Implement IP allow-listing and secure communication protocols.

7. **Testing and Documentation**
   - Achieve at least 90% test coverage with unit, integration, and end-to-end tests.
   - Document all APIs, data schemas, and deployment procedures inline and in dedicated documentation files.

## Development Guidelines

- Use local dependencies and `npx` for all CLI tool executions.
- Follow consistent naming conventions and modularize components.
- Optimize frontend code for performance and accessibility.
- Implement message batching for WebSocket communications.
- Use compressed and modern image formats for assets.

## Deliverables

- Updated telemetry schema and API integration code.
- New streaming REST API endpoint with push-based data delivery.
- Updated frontend components to display nested weather data and analytics.
- Deployment scripts and CI/CD workflows.
- Comprehensive test suite and documentation.

## References

- Tessie API documentation and integration notes.
- WebSocket implementation and vehicle stream API docs.
- Deployment strategy and monitoring guidelines.

---

This prompt excludes any GPU-related components or references.
