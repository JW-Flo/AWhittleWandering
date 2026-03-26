export type AllowedOrigin = string | RegExp;
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export interface CorsErrorDetails {
  origin: string;
  method: string;
  reason: string;
}