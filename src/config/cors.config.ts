import { CorsOptions } from 'cors';

export interface CorsConfiguration {
  allowedOrigins: string[];
  methods: string[];
  maxAge?: number;
  credentials?: boolean;
}

export const defaultCorsConfig: CorsConfiguration = {
  allowedOrigins: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 3600,
  credentials: true
};

export function createCorsOptions(config: CorsConfiguration = defaultCorsConfig): CorsOptions {
  return {
    origin: config.allowedOrigins,
    methods: config.methods,
    maxAge: config.maxAge,
    credentials: config.credentials
  };
}