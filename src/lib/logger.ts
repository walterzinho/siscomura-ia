/**
 * Lightweight structured logger for API routes.
 * In production, Vercel captures console output — we use structured format.
 */

type LogLevel = 'error' | 'warn' | 'info';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  route: string;
  message: string;
  [key: string]: unknown;
}

function format(entry: LogEntry): string {
  return JSON.stringify(entry);
}

export function logError(route: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    route,
    message,
    ...extra,
  };
  console.error(format(entry));
}

export function logWarn(route: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'warn',
    route,
    message,
    ...extra,
  };
  console.warn(format(entry));
}

export function logInfo(route: string, message: string, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    route,
    message,
    ...extra,
  };
  console.info(format(entry));
}
