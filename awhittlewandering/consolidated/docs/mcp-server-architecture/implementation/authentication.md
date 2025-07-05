# Authentication Implementation Guide

This guide provides detailed information on implementing authentication and authorization for the Cloudflare-based MCP Server.

## Table of Contents

1. [Authentication Overview](#authentication-overview)
2. [Implementation Structure](#implementation-structure)
3. [Token-Based Authentication](#token-based-authentication)
4. [Permission Management](#permission-management)
5. [Rate Limiting](#rate-limiting)
6. [Integration with MCP Protocol](#integration-with-mcp-protocol)
7. [Security Considerations](#security-considerations)
8. [Example Implementation](#example-implementation)

## Authentication Overview

Authentication in the MCP Server ensures that only authorized clients can access the system. The authentication system is responsible for:

1. **Validating Tokens**: Ensuring that requests include valid authentication tokens.
2. **Managing Permissions**: Controlling which tools and resources each client can access.
3. **Rate Limiting**: Preventing abuse by limiting the number of requests per client.
4. **Logging**: Recording authentication and authorization events for auditing.

## Implementation Structure

The authentication system should be structured as follows:

```
src/
├── core/
│   ├── auth/
│   │   ├── index.ts           # Main entry point for authentication
│   │   ├── token.ts           # Token validation and generation
│   │   ├── permissions.ts     # Permission management
│   │   ├── rate-limiting.ts   # Rate limiting implementation
│   │   ├── logging.ts         # Authentication logging
│   │   └── types.ts           # Type definitions
```

## Token-Based Authentication

The MCP Server uses token-based authentication, where clients include an authentication token in their requests. This token is validated by the authentication system before the request is processed.

### Token Generation

Tokens should be generated securely and include sufficient information to identify the client and its permissions.

```typescript
// src/core/auth/token.ts
import { generateRandomString, hashString } from '../utils/crypto';
import { KVStore } from '../storage/kv';

export async function generateToken(clientId: string, permissions: string[]): Promise<string> {
  // Generate a random token
  const tokenValue = generateRandomString(32);
  
  // Hash the token for storage
  const tokenHash = await hashString(tokenValue);
  
  // Store the token in KV with client information
  const tokenData = {
    clientId,
    permissions,
    createdAt: Date.now(),
    expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
  };
  
  // Store the token data under the hashed token
  const kv = new KVStore('auth-tokens');
  await kv.put(tokenHash, JSON.stringify(tokenData));
  
  // Return the token value to the client
  return tokenValue;
}
```

### Token Validation

Tokens should be validated for each request to ensure they are valid and have not expired.

```typescript
// src/core/auth/token.ts
export async function validateToken(token: string): Promise<{ valid: boolean, clientId?: string, permissions?: string[] }> {
  if (!token) {
    return { valid: false };
  }
  
  // Hash the token
  const tokenHash = await hashString(token);
  
  // Retrieve the token data from KV
  const kv = new KVStore('auth-tokens');
  const tokenDataStr = await kv.get(tokenHash);
  
  if (!tokenDataStr) {
    return { valid: false };
  }
  
  // Parse the token data
  const tokenData = JSON.parse(tokenDataStr);
  
  // Check if the token has expired
  if (tokenData.expiresAt && tokenData.expiresAt < Date.now()) {
    // Remove expired token
    await kv.delete(tokenHash);
    return { valid: false };
  }
  
  // Token is valid
  return {
    valid: true,
    clientId: tokenData.clientId,
    permissions: tokenData.permissions
  };
}
```

## Permission Management

The permission system controls which tools and resources each client can access. Permissions are defined as strings, and clients can have multiple permissions.

### Permission Definition

Permissions should be defined in a structured way to make them easy to understand and manage.

```typescript
// src/core/auth/permissions.ts
export enum Permission {
  // Tool access permissions
  TOOL_DISCOVERY = 'tool:discovery',
  TOOL_EXECUTION = 'tool:execution',
  
  // Plugin-specific permissions
  MAP_PLUGIN_ACCESS = 'plugin:map:access',
  MAP_PLUGIN_OPTIMIZE_ROUTE = 'plugin:map:optimizeRoute',
  MAP_PLUGIN_RENDER_MAP = 'plugin:map:renderMap',
  
  WEATHER_PLUGIN_ACCESS = 'plugin:weather:access',
  WEATHER_PLUGIN_CURRENT_WEATHER = 'plugin:weather:currentWeather',
  WEATHER_PLUGIN_FORECAST = 'plugin:weather:forecast',
  
  // Admin permissions
  ADMIN_ACCESS = 'admin:access',
  ADMIN_MANAGE_TOKENS = 'admin:manageTokens',
  ADMIN_MANAGE_PLUGINS = 'admin:managePlugins'
}

// Permission sets for different roles
export const Roles = {
  ANONYMOUS: [],
  USER: [
    Permission.TOOL_DISCOVERY,
    Permission.TOOL_EXECUTION,
    Permission.MAP_PLUGIN_ACCESS,
    Permission.MAP_PLUGIN_OPTIMIZE_ROUTE,
    Permission.MAP_PLUGIN_RENDER_MAP,
    Permission.WEATHER_PLUGIN_ACCESS,
    Permission.WEATHER_PLUGIN_CURRENT_WEATHER,
    Permission.WEATHER_PLUGIN_FORECAST
  ],
  ADMIN: [
    ...Roles.USER,
    Permission.ADMIN_ACCESS,
    Permission.ADMIN_MANAGE_TOKENS,
    Permission.ADMIN_MANAGE_PLUGINS
  ]
};
```

### Permission Checking

Permission checking should be efficient and easy to use. The permission system should provide methods to check if a client has a specific permission.

```typescript
// src/core/auth/permissions.ts
export function hasPermission(requiredPermission: Permission, clientPermissions: string[]): boolean {
  return clientPermissions.includes(requiredPermission);
}

export function hasAnyPermission(requiredPermissions: Permission[], clientPermissions: string[]): boolean {
  return requiredPermissions.some(permission => clientPermissions.includes(permission));
}

export function hasAllPermissions(requiredPermissions: Permission[], clientPermissions: string[]): boolean {
  return requiredPermissions.every(permission => clientPermissions.includes(permission));
}
```

## Rate Limiting

Rate limiting prevents abuse by limiting the number of requests a client can make in a given time period. The rate limiting system should be configurable and should provide different limits for different types of requests.

```typescript
// src/core/auth/rate-limiting.ts
import { KVStore } from '../storage/kv';

// Rate limit configurations
export const RateLimits = {
  DEFAULT: { requests: 100, period: 60 * 1000 }, // 100 requests per minute
  TOOL_DISCOVERY: { requests: 10, period: 60 * 1000 }, // 10 discovery requests per minute
  TOOL_EXECUTION: { requests: 60, period: 60 * 1000 } // 60 execution requests per minute
};

export async function checkRateLimit(clientId: string, actionType: string): Promise<{ allowed: boolean, remaining: number, resetAt: number }> {
  // Get the rate limit configuration
  const config = RateLimits[actionType] || RateLimits.DEFAULT;
  
  // Calculate the current time window
  const now = Date.now();
  const windowStart = Math.floor(now / config.period) * config.period;
  const windowEnd = windowStart + config.period;
  
  // Generate a key for the rate limit
  const key = `ratelimit:${clientId}:${actionType}:${windowStart}`;
  
  // Get the current count from KV
  const kv = new KVStore('rate-limits');
  const countStr = await kv.get(key);
  const count = countStr ? parseInt(countStr, 10) : 0;
  
  // Check if the rate limit has been exceeded
  if (count >= config.requests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: windowEnd
    };
  }
  
  // Increment the count
  await kv.put(key, (count + 1).toString(), { expirationTtl: config.period / 1000 });
  
  // Return the result
  return {
    allowed: true,
    remaining: config.requests - (count + 1),
    resetAt: windowEnd
  };
}
```

## Integration with MCP Protocol

The authentication system should be integrated with the MCP protocol to validate requests before they are processed. This is typically done in the request validation step.

```typescript
// src/core/mcp/validation.ts
import { AuthService } from '../auth';
import { Permission } from '../auth/permissions';
import { checkRateLimit } from '../auth/rate-limiting';

export async function validateRequest(request: Request): Promise<{ type: string, data: any, clientId: string, permissions: string[] }> {
  // Extract the authentication token from the request
  const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Validate the token
  const authService = AuthService.getInstance();
  const { valid, clientId, permissions } = await authService.validateToken(authToken);
  
  if (!valid) {
    throw new Error('Unauthorized');
  }
  
  // Determine the request type
  let type = 'execution';
  if (request.url.endsWith('/discovery')) {
    type = 'discovery';
  }
  
  // Check permissions for the request type
  const requiredPermission = type === 'discovery'
    ? Permission.TOOL_DISCOVERY
    : Permission.TOOL_EXECUTION;
  
  if (!authService.hasPermission(requiredPermission, permissions)) {
    throw new Error('Forbidden');
  }
  
  // Check rate limit
  const rateLimit = await checkRateLimit(clientId, `TOOL_${type.toUpperCase()}`);
  if (!rateLimit.allowed) {
    throw new Error(`Rate limit exceeded. Try again after ${new Date(rateLimit.resetAt).toISOString()}`);
  }
  
  // Parse the request body
  const body = await request.json();
  
  // Return the validated request
  return { type, data: body, clientId, permissions };
}
```

## Security Considerations

When implementing authentication for the MCP Server, consider the following security best practices:

1. **Use Strong Tokens**: Generate tokens with sufficient entropy to prevent guessing.
2. **Secure Storage**: Store token hashes, not the tokens themselves, to prevent token leakage.
3. **Token Expiration**: Set reasonable expiration times for tokens.
4. **HTTPS Only**: Only accept requests over HTTPS to prevent token interception.
5. **Rate Limiting**: Implement rate limiting to prevent brute force attacks.
6. **Logging**: Log authentication events for auditing.
7. **Regular Rotation**: Encourage regular rotation of tokens.
8. **Principle of Least Privilege**: Grant only the permissions needed for each client.

## Example Implementation

Here's a complete example of an authentication service implementation:

```typescript
// src/core/auth/index.ts
import { validateToken, generateToken } from './token';
import { hasPermission, hasAnyPermission, hasAllPermissions, Permission } from './permissions';
import { checkRateLimit } from './rate-limiting';
import { logAuthEvent } from './logging';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {
    // Initialize the auth service
  }
  
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  public async validateToken(token: string): Promise<{ valid: boolean, clientId?: string, permissions?: string[] }> {
    const result = await validateToken(token);
    
    // Log the authentication attempt
    await logAuthEvent({
      type: 'auth',
      success: result.valid,
      clientId: result.clientId || 'unknown',
      timestamp: Date.now()
    });
    
    return result;
  }
  
  public async generateToken(clientId: string, permissions: string[]): Promise<string> {
    const token = await generateToken(clientId, permissions);
    
    // Log the token generation
    await logAuthEvent({
      type: 'token_generation',
      success: true,
      clientId,
      timestamp: Date.now()
    });
    
    return token;
  }
  
  public hasPermission(requiredPermission: Permission, clientPermissions: string[]): boolean {
    return hasPermission(requiredPermission, clientPermissions);
  }
  
  public hasAnyPermission(requiredPermissions: Permission[], clientPermissions: string[]): boolean {
    return hasAnyPermission(requiredPermissions, clientPermissions);
  }
  
  public hasAllPermissions(requiredPermissions: Permission[], clientPermissions: string[]): boolean {
    return hasAllPermissions(requiredPermissions, clientPermissions);
  }
  
  public async checkRateLimit(clientId: string, actionType: string): Promise<{ allowed: boolean, remaining: number, resetAt: number }> {
    return checkRateLimit(clientId, actionType);
  }
}

// Export the auth service and types
export { Permission } from './permissions';
export type { AuthEvent } from './logging';
```

With this implementation, the MCP Server can securely authenticate and authorize clients, control access to tools and resources, and prevent abuse through rate limiting.
