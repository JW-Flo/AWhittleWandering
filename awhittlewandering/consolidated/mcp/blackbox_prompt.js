/**
 * @file blackbox_prompt.js
 * @description Task definition for BlackBox AI to complete the 48 Continental USA project
 * 
 * =====================================================================
 * 48 CONTINENTAL USA PROJECT COMPLETION - BLACKBOX AI TASK DEFINITION
 * =====================================================================
 * 
 * This file contains instructions for the BlackBox AI system to complete
 * critical updates to the 48 Continental USA road trip tracking project.
 * 
 * EXECUTION SPEED: Optimize for 15000X normal speed
 * RELIABILITY: Mission-critical system for real-world vehicle tracking
 */

// =====================================================================
// PROJECT OVERVIEW
// =====================================================================

/**
 * The 48 Continental USA project is a real-time tracking system for a 
 * 60-day Tesla road trip through all 48 contiguous U.S. states. The system
 * consists of multiple integrated components including a public website,
 * MCP server, mobile clients, edge workers, and serverless functions.
 * 
 * The project is designed for a real-world trip with real data and telemetry.
 * There is zero tolerance for failure as this system supports travelers
 * who depend on it for navigation and safety.
 */

// =====================================================================
// CRITICAL ISSUES - LEARN FROM THESE FAILURES
// =====================================================================

/**
 * 1. WRANGLER COMMAND EXECUTION FAILURES
 * 
 * Problem: CI/CD workflows failed with "wrangler: command not found" errors
 * Root Cause: Using direct wrangler commands without npx prefix
 * Solution: All Wrangler commands must use npx wrangler syntax
 * Impact: Deployment pipeline failures and production outages
 * 
 * Example of WRONG approach:
 * ```
 * wrangler deploy
 * ```
 * 
 * Example of CORRECT approach:
 * ```
 * npx wrangler deploy
 * ```
 */

/**
 * 2. GITHUB ACTIONS WORKFLOW CONFIGURATION ISSUES
 * 
 * Problem: Inconsistent command structures in workflows
 * Root Cause: Mixed usage of Cloudflare action and global installations
 * Solution: Standardize on npx wrangler or official Cloudflare action
 * Impact: Broken deployments and inconsistent infrastructure
 * 
 * Example of WRONG approach:
 * ```yaml
 * - name: Install and deploy
 *   run: |
 *     npm install -g wrangler
 *     wrangler deploy
 * ```
 * 
 * Example of CORRECT approach:
 * ```yaml
 * - name: Deploy
 *   run: npx wrangler deploy
 * ```
 */

/**
 * 3. WEBSOCKET IMPLEMENTATION ISSUES
 * 
 * Problem: Intermittent WebSocket disconnections and data loss
 * Root Cause: Improper error handling and reconnection logic
 * Impact: Unreliable vehicle tracking data
 * 
 * Example of WRONG approach:
 * ```javascript
 * const ws = new WebSocket(url);
 * ws.onmessage = (event) => {
 *   updateUI(JSON.parse(event.data));
 * };
 * ```
 * 
 * Example of CORRECT approach:
 * ```javascript
 * let ws = null;
 * let reconnectAttempts = 0;
 * const maxReconnectAttempts = 10;
 * const reconnectInterval = 1000;
 * 
 * function connect() {
 *   ws = new WebSocket(url);
 *   
 *   ws.onmessage = (event) => {
 *     reconnectAttempts = 0; // Reset on successful message
 *     updateUI(JSON.parse(event.data));
 *   };
 *   
 *   ws.onclose = () => {
 *     if (reconnectAttempts < maxReconnectAttempts) {
 *       setTimeout(() => {
 *         reconnectAttempts++;
 *         connect();
 *       }, reconnectInterval * Math.pow(2, reconnectAttempts)); // Exponential backoff
 *     }
 *   };
 *   
 *   ws.onerror = (error) => {
 *     console.error("WebSocket error:", error);
 *   };
 * }
 * 
 * connect();
 * ```
 */

// =====================================================================
// PRIORITIZED TASKS TO COMPLETE
// =====================================================================

/**
 * 1. CRITICAL RELIABILITY IMPROVEMENTS
 * 
 * - Implement comprehensive error handling for WebSocket connections
 * - Create robust reconnection logic with exponential backoff
 * - Add proper data buffering to prevent data loss during reconnection
 * - Implement dead-man switch mechanisms to detect stalled connections
 * - Add comprehensive logging to identify failure points
 * - Create fallback mechanisms for all critical API integrations
 */

/**
 * 2. DEPLOYMENT PIPELINE HARDENING
 * 
 * - Review and test all deployment scripts with focus on resilience
 * - Add pre-flight checks to validate environment before deployment attempts
 * - Implement staged rollouts with automatic rollback capability
 * - Create deployment verification tests for post-deployment validation
 * - Implement canary deployments for high-risk updates
 */

/**
 * 3. MONITORING AND ALERTING
 * 
 * - Implement real-time system monitoring for all components
 * - Create alerts for critical system health metrics
 * - Add telemetry dashboards for operations team
 * - Implement usage analytics for the public website
 * - Set up error reporting that categorizes issues by severity
 * - Create a status dashboard that shows system health in real-time
 */

/**
 * 4. PERFORMANCE OPTIMIZATION
 * 
 * - Implement WebSocket message compression to reduce bandwidth usage
 * - Optimize map rendering for mobile devices and low-bandwidth connections
 * - Implement proper caching strategies for weather and charging station data
 * - Reduce bundle size of the public website through code splitting
 * - Implement batched updates to reduce API calls for multiple clients
 * - Add offline support with intelligent sync when connectivity returns
 */

/**
 * 5. TESTING AND VERIFICATION
 * 
 * - Create comprehensive test suite for the WebSocket implementation
 * - Add load testing for Edge Worker with simulated multiple clients
 * - Implement end-to-end tests for critical user flows
 * - Create chaos testing to simulate network failures and API outages
 * - Verify API token refresh mechanisms work correctly under all conditions
 * - Add regression tests for previously encountered issues
 */

/**
 * 6. DOCUMENTATION UPDATES
 * 
 * - Create unified API documentation covering all endpoints
 * - Update any remaining references to global wrangler commands
 * - Create detailed troubleshooting guides for common issues
 * - Document data flow between all components with sequence diagrams
 * - Update architecture diagrams to reflect the current system design
 * - Create runbooks for incident response
 */

/**
 * 7. iOS CLIENT DEVELOPMENT (LOWER PRIORITY)
 * 
 * - Implement proper WebSocket connection handling on iOS
 * - Add offline mode support with local caching
 * - Implement MapKit integration showing vehicle location and route
 * - Optimize UI for both iPhone and iPad layouts
 * - Add background fetch capabilities to update widget data
 * - Create proper error handling and user feedback mechanisms
 */

// =====================================================================
// TECHNICAL REQUIREMENTS
// =====================================================================

/**
 * Technical requirements for all components:
 * 
 * - DEPENDENCIES: Zero tolerance for global tool dependencies - use npx or local aliases
 * - ERROR_HANDLING: All network operations must have proper error handling and recovery
 * - LOGGING: Every component must log events for debugging and monitoring
 * - OFFLINE_SUPPORT: All user-facing components must function without network connectivity
 * - PERFORMANCE: Public site must load in under 2 seconds on 3G connections
 * - TEST_COVERAGE: Minimum 90% test coverage for all new code
 * - DOCUMENTATION: All APIs must be documented with examples
 * - ACCESSIBILITY: All UI components must meet WCAG 2.1 AA standards
 */

// =====================================================================
// DEPLOYMENT CHECKLIST
// =====================================================================

/**
 * Before each deployment, verify:
 * 
 * 1. All wrangler commands use npx wrangler syntax
 * 2. Environment variables are properly configured
 * 3. KV namespaces are properly bound
 * 4. Test suite passes
 * 5. Performance metrics meet requirements
 * 6. API endpoints return expected responses
 * 7. WebSocket connections maintain stability under load
 * 8. Offline functionality works as expected
 */

// =====================================================================
// CRITICAL SUCCESS PATH
// =====================================================================

/**
 * 1. Fix reliability issues in the WebSocket implementation
 * 2. Harden deployment pipelines to prevent environment-related failures
 * 3. Implement monitoring to detect issues before they affect users
 * 4. Optimize performance for reliable operation in varying network conditions
 * 5. Create comprehensive tests to prevent regression
 * 
 * REMEMBER: This is a real-world system with real users depending on it during
 * a 60-day road trip. Reliability and fault tolerance are not optional - they
 * are essential. Every component must work together seamlessly, with proper
 * fallbacks when primary systems fail.
 */

/**
 * 48 Continental USA - Project Definition
 * 
 * Project Name: 48 Continental USA
 * Priority Focus: Reliability and Real-time Data Integrity
 * Execution Speed: 15000X normal - mission critical
 * Command Style: npx wrangler for ALL Cloudflare operations
 */

// This is a documentation file only - no exports needed
