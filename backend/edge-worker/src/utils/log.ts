// Structured logging utility (initial lightweight version)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let globalLogLevel: LogLevel = (typeof (globalThis as any).LOG_LEVEL === 'string' ? (globalThis as any).LOG_LEVEL : 'info') as LogLevel;
// Simple correlation id set per request (middleware will update)
let correlationId: string | undefined;

export function setLogLevel(l: LogLevel) { globalLogLevel = l; }
export function setCorrelationId(id?: string) { correlationId = id; }

const levelOrder: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

// Keys to redact if present in meta
const REDACT_KEYS = ['authorization', 'auth', 'password', 'apiKey', 'token', 'secret'];

function redactMeta(meta?: LogMeta) {
  if (!meta) return meta;
  const clone: LogMeta = {};
  for (const k of Object.keys(meta)) {
    if (REDACT_KEYS.includes(k.toLowerCase())) {
      clone[k] = '[REDACTED]';
    } else {
      const v = (meta as any)[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        clone[k] = redactMeta(v as LogMeta);
      } else {
        clone[k] = v;
      }
    }
  }
  return clone;
}

export interface LogMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface StructuredLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  meta?: LogMeta;
}

export function log(level: LogLevel, message: string, meta?: LogMeta) {
  if (levelOrder[level] < levelOrder[globalLogLevel]) return; // filtered out
  const entry: StructuredLogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(correlationId ? { meta: { correlationId } } : {})
  };
  if (meta) {
    entry.meta = { ...(entry.meta || {}), ...redactMeta(meta) };
  }

  const line = JSON.stringify(entry);
  switch (level) {
    case 'debug': console.debug(line); break; // eslint-disable-line no-console
    case 'info': console.info(line); break; // eslint-disable-line no-console
    case 'warn': console.warn(line); break; // eslint-disable-line no-console
    case 'error': console.error(line); break; // eslint-disable-line no-console
  }
  return entry;
}

export const logger = {
  debug: (m: string, meta?: LogMeta) => log('debug', m, meta),
  info: (m: string, meta?: LogMeta) => log('info', m, meta),
  warn: (m: string, meta?: LogMeta) => log('warn', m, meta),
  error: (m: string, meta?: LogMeta) => log('error', m, meta)
};

export function extractError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === 'string') return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: 'Unknown error' };
  }
}

/**
 * Simple helper to get error message from unknown error type
 * Use in catch blocks: catch (error) { const msg = getErrorMessage(error); }
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Unknown error';
}
