/**
 * Structured Logger for VenuePulse
 * 
 * Provides structured logging with severity levels and context.
 * In production, this could be extended to send logs to a remote service.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// Current minimum log level (can be changed at runtime)
let minLevel: LogLevel = import.meta.env.DEV ? 'debug' : 'info';

export function setLogLevel(level: LogLevel): void {
  minLevel = level;
}

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel];
}

function formatLogEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
  
  if (entry.context) {
    return `${base} ${JSON.stringify(entry.context)}`;
  }
  
  if (entry.error) {
    const errorInfo = `${entry.error.name}: ${entry.error.message}`;
    return entry.error.stack 
      ? `${base} ${errorInfo}\n${entry.error.stack}` 
      : `${base} ${errorInfo}`;
  }
  
  return base;
}

function createLogEntry(
  level: LogLevel, 
  message: string, 
  context?: Record<string, unknown>,
  error?: Error
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error: error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : undefined,
  };
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  if (!shouldLog(level)) return;
  
  const entry = createLogEntry(level, message, context, error);
  const formatted = formatLogEntry(entry);
  
  // Output to console with appropriate method
  switch (level) {
    case 'debug':
      console.debug(formatted);
      break;
    case 'info':
      console.info(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    log('debug', message, context);
  },
  
  info(message: string, context?: Record<string, unknown>): void {
    log('info', message, context);
  },
  
  warn(message: string, context?: Record<string, unknown>): void {
    log('warn', message, context);
  },
  
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    log('error', message, context, error);
  },
};
