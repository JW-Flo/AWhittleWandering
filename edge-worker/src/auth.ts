/**
 * JWT Authentication module for AWhittleWandering admin routes
 * Implements HS256 JWT verification for securing admin endpoints
 */

// Error types for authentication failures
export enum AuthErrorType {
  MISSING_TOKEN = 'missing_token',
  INVALID_TOKEN = 'invalid_token',
  EXPIRED_TOKEN = 'expired_token',
  INVALID_SIGNATURE = 'invalid_signature',
  MISSING_SECRET = 'missing_secret',
}

export class AuthError extends Error {
  constructor(public type: AuthErrorType, message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * JWT Payload structure
 */
export interface JWTPayload {
  sub?: string;       // Subject (user ID)
  exp?: number;       // Expiration time
  iat?: number;       // Issued at
  admin?: boolean;    // Admin flag
  [key: string]: any; // Allow for additional custom claims
}

/**
 * Parse and decode a JWT token without verification
 * @param token JWT token string
 * @returns Decoded payload
 */
export function decodeJWT(token: string): JWTPayload {
  try {
    const [, payload] = token.split('.');
    if (!payload) {
      throw new AuthError(AuthErrorType.INVALID_TOKEN, 'Invalid JWT format');
    }
    
    // Base64url decode and parse as JSON
    const decoded = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(payload.replace(/-/g, '+').replace(/_/g, '/')), 
          c => c.charCodeAt(0)
        )
      )
    );
    
    return decoded as JWTPayload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      AuthErrorType.INVALID_TOKEN,
      'Failed to decode JWT: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

/**
 * Verify a JWT token using HS256 algorithm
 * @param token JWT token to verify
 * @param secret Secret key for verification
 * @returns Decoded and verified payload
 */
export async function verifyJWT(token: string, secret: string): Promise<JWTPayload> {
  if (!token) {
    throw new AuthError(AuthErrorType.MISSING_TOKEN, 'JWT token is required');
  }
  
  if (!secret) {
    throw new AuthError(AuthErrorType.MISSING_SECRET, 'JWT secret is required');
  }
  
  try {
    // Split the JWT parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new AuthError(AuthErrorType.INVALID_TOKEN, 'Invalid JWT format');
    }
    
    const [header, payload, signature] = parts;
    
    // Verify expiration
    const decodedPayload = decodeJWT(token);
    
    if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
      throw new AuthError(AuthErrorType.EXPIRED_TOKEN, 'JWT token has expired');
    }
    
    // Verify signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(`${header}.${payload}`);
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    // Convert base64url signature to binary
    const signatureBytes = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    );
    
    // Verify the signature
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes,
      data
    );
    
    if (!isValid) {
      throw new AuthError(AuthErrorType.INVALID_SIGNATURE, 'JWT signature verification failed');
    }
    
    return decodedPayload;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      AuthErrorType.INVALID_TOKEN,
      'Failed to verify JWT: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

/**
 * Verify an admin JWT token and confirm admin privileges
 * @param token JWT token to verify
 * @param secret Admin JWT secret key
 * @returns True if verification succeeds and token has admin privileges
 * @throws AuthError if verification fails or token lacks admin privileges
 */
export async function verifyAdmin(token: string, secret: string): Promise<boolean> {
  try {
    const payload = await verifyJWT(token, secret);
    
    // Check for admin flag in payload
    if (!payload.admin) {
      throw new AuthError(AuthErrorType.INVALID_TOKEN, 'Token does not have admin privileges');
    }
    
    return true;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError(
      AuthErrorType.INVALID_TOKEN,
      'Admin verification failed: ' + (error instanceof Error ? error.message : String(error))
    );
  }
}

/**
 * Create Response object for authentication errors
 * @param error Authentication error
 * @returns Response with appropriate status code and error details
 */
export function createAuthErrorResponse(error: AuthError): Response {
  const statusCode = error.type === AuthErrorType.EXPIRED_TOKEN || 
                    error.type === AuthErrorType.INVALID_TOKEN || 
                    error.type === AuthErrorType.INVALID_SIGNATURE ? 
                    401 : 400;
  
  return new Response(
    JSON.stringify({
      error: error.type,
      message: error.message,
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Middleware for protecting admin routes
 * @param request Incoming request
 * @param env Environment variables containing ADMIN_JWT_SECRET
 * @returns Response object if authentication fails, or null if authentication succeeds
 */
export async function adminAuthMiddleware(request: Request, env: { ADMIN_JWT_SECRET: string }): Promise<Response | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError(AuthErrorType.MISSING_TOKEN, 'Missing or invalid Authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    await verifyAdmin(token, env.ADMIN_JWT_SECRET);
    
    // Authentication successful
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return createAuthErrorResponse(error);
    }
    
    // Unexpected error
    return new Response(
      JSON.stringify({
        error: 'server_error',
        message: 'Authentication failed due to server error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
