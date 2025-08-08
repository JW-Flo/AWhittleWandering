// Structured logging utility (initial lightweight version)
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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
  const entry: StructuredLogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {})
  };

  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(entry);
      break;
    case 'info':
      // eslint-disable-next-line no-console
      console.info(entry);
      break;
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(entry);
      break;
    case 'error':
      // eslint-disable-next-line no-console
      console.error(entry);
      break;
  }
  return entry;
}

export function extractError(err: unknown): { message: string; stack?: string } {
  if (err instanceof Error) return { message: err.message, stack: err.stack };
  if (typeof err === 'string') return { message: err };
  try {
    return { message: JSON.stringify(err) };
  } catch {
    return { message: 'Unknown error' };
  }
}
