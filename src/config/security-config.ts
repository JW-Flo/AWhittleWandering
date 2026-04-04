import { z } from 'zod';

// Security configuration schemas and middleware

// Rate limiting configuration schema
const RateLimitConfigSchema = z.object({
  maxRequests: z.number().int().positive().default(100),
  windowMs: z.number().int().positive().default(15 * 60 * 1000), // 15 minutes
});

// CORS configuration schema
const CorsConfigSchema = z.object({
  allowedOrigins: z.array(z.string()).default(['*']),
  allowedMethods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
  allowedHeaders: z.array(z.string()).default([
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ]),
  credentials: z.boolean().default(false),
});

// Security headers configuration schema
const SecurityHeadersSchema = z.object({
  strictTransportSecurity: z.boolean().default(true),
  xFrameOptions: z.enum(['DENY', 'SAMEORIGIN']).default('SAMEORIGIN'),
  xXssProtection: z.boolean().default(true),
  contentSecurityPolicy: z.string().optional(),
});

// Default security configurations
export const defaultRateLimitConfig = RateLimitConfigSchema.parse({
  maxRequests: 100,
  windowMs: 15 * 60 * 1000,
});

export const defaultCorsConfig = CorsConfigSchema.parse({
  allowedOrigins: ['*'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin'
  ],
  credentials: false,
});

export const defaultSecurityHeadersConfig = SecurityHeadersSchema.parse({
  strictTransportSecurity: true,
  xFrameOptions: 'SAMEORIGIN',
  xXssProtection: true,
});

// Security configuration type exports
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type CorsConfig = z.infer<typeof CorsConfigSchema>;
export type SecurityHeadersConfig = z.infer<typeof SecurityHeadersSchema>;

// Security middleware configuration function
export function configureSecurity({
  rateLimitConfig = defaultRateLimitConfig,
  corsConfig = defaultCorsConfig,
  securityHeadersConfig = defaultSecurityHeadersConfig
}: {
  rateLimitConfig?: RateLimitConfig,
  corsConfig?: CorsConfig,
  securityHeadersConfig?: SecurityHeadersConfig
} = {}) {
  // Validate configurations using Zod schemas
  const validatedRateLimitConfig = RateLimitConfigSchema.parse(rateLimitConfig);
  const validatedCorsConfig = CorsConfigSchema.parse(corsConfig);
  const validatedSecurityHeadersConfig = SecurityHeadersSchema.parse(securityHeadersConfig);

  // Return middleware configuration object
  return {
    rateLimiting: {
      max: validatedRateLimitConfig.maxRequests,
      windowMs: validatedRateLimitConfig.windowMs,
    },
    cors: {
      origin: validatedCorsConfig.allowedOrigins,
      methods: validatedCorsConfig.allowedMethods,
      allowedHeaders: validatedCorsConfig.allowedHeaders,
      credentials: validatedCorsConfig.credentials,
    },
    headers: {
      strictTransportSecurity: validatedSecurityHeadersConfig.strictTransportSecurity,
      xFrameOptions: validatedSecurityHeadersConfig.xFrameOptions,
      xXssProtection: validatedSecurityHeadersConfig.xXssProtection,
      contentSecurityPolicy: validatedSecurityHeadersConfig.contentSecurityPolicy,
    }
  };
}
