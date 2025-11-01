import { nanoid } from 'nanoid';

/**
 * Server-side structured logging utility for Vercel
 * Logs will appear in Vercel's dashboard with proper formatting
 */

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${nanoid(10)}`;
}

/**
 * Format a log message with timestamp, level, and context
 */
function formatLog(
  requestId: string,
  level: LogLevel,
  operation: string,
  message: string,
  context?: LogContext
): string {
  const timestamp = new Date().toISOString();
  const baseLog = `[${requestId}] [${timestamp}] [${level}] [${operation}] ${message}`;

  if (context && Object.keys(context).length > 0) {
    return `${baseLog} ${JSON.stringify(context)}`;
  }

  return baseLog;
}

/**
 * Structured logger class for server-side operations
 */
export class ServerLogger {
  private requestId: string;

  constructor(requestId?: string) {
    this.requestId = requestId || generateRequestId();
  }

  getRequestId(): string {
    return this.requestId;
  }

  info(operation: string, message: string, context?: LogContext): void {
    console.log(formatLog(this.requestId, 'INFO', operation, message, context));
  }

  warn(operation: string, message: string, context?: LogContext): void {
    console.warn(formatLog(this.requestId, 'WARN', operation, message, context));
  }

  error(operation: string, message: string, context?: LogContext): void {
    console.error(formatLog(this.requestId, 'ERROR', operation, message, context));
  }

  debug(operation: string, message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatLog(this.requestId, 'DEBUG', operation, message, context));
    }
  }

  /**
   * Log timing information for performance monitoring
   */
  timing(operation: string, startTime: number, context?: LogContext): void {
    const duration = Date.now() - startTime;
    this.info(operation, `Completed in ${duration}ms`, {
      ...context,
      duration_ms: duration,
    });
  }
}
