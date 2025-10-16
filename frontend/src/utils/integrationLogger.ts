/**
 * Integration Logger - Detailed logging for debugging text integration issues
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class IntegrationLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private enabled = false; // Disabled by default for performance

  log(level: LogLevel, category: string, message: string, data?: any) {
    if (!this.enabled) return;

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      category,
      message,
      data,
    };

    this.logs.push(entry);

    // Keep only the last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Also log to console
    const prefix = `[${category}]`;
    const logData = data ? [prefix, message, data] : [prefix, message];

    switch (level) {
      case 'debug':
        console.debug(...logData);
        break;
      case 'info':
        console.info(...logData);
        break;
      case 'warn':
        console.warn(...logData);
        break;
      case 'error':
        console.error(...logData);
        break;
    }
  }

  debug(category: string, message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  info(category: string, message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: string, message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: string, message: string, data?: any) {
    this.log('error', category, message, data);
  }

  // Convenience methods for common logging patterns
  logChange(operation: string, data?: any) {
    this.info('change', operation, data);
  }

  logError(operation: string, error: string | any) {
    this.error('error', operation, typeof error === 'string' ? error : JSON.stringify(error));
  }

  logSuccess(operation: string, data?: any) {
    this.info('success', operation, data);
  }

  getLogs(filter?: { level?: LogLevel; category?: string; since?: Date }): LogEntry[] {
    let filtered = this.logs;

    if (filter) {
      if (filter.level) {
        filtered = filtered.filter((log) => log.level === filter.level);
      }
      if (filter.category) {
        filtered = filtered.filter((log) => log.category === filter.category);
      }
      if (filter.since) {
        filtered = filtered.filter((log) => log.timestamp >= filter.since!);
      }
    }

    return filtered;
  }

  clear() {
    this.logs = [];
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get a summary of recent errors
   */
  getErrorSummary(): string {
    const errors = this.logs.filter((log) => log.level === 'error');

    if (errors.length === 0) {
      return 'No errors logged';
    }

    return errors
      .slice(-10) // Last 10 errors
      .map((error) => {
        const time = error.timestamp.toLocaleTimeString();
        return `[${time}] ${error.category}: ${error.message}`;
      })
      .join('\n');
  }
}

// Singleton instance
export const integrationLogger = new IntegrationLogger();

// Helper functions for common logging scenarios
export const logSuggestionApplication = (
  suggestionId: string,
  type: string,
  from: number,
  to: number,
  originalText: string,
  suggestedText: string
) => {
  integrationLogger.info('suggestion', `Applying ${type} suggestion`, {
    id: suggestionId,
    from,
    to,
    originalText: originalText.substring(0, 50),
    suggestedText: suggestedText.substring(0, 50),
  });
};

export const logPositionValidation = (
  from: number,
  to: number,
  expectedText: string,
  actualText: string,
  valid: boolean
) => {
  if (!valid) {
    integrationLogger.warn('validation', 'Position validation failed', {
      from,
      to,
      expected: expectedText.substring(0, 50),
      actual: actualText.substring(0, 50),
    });
  } else {
    integrationLogger.debug('validation', 'Position validated successfully', {
      from,
      to,
      textLength: actualText.length,
    });
  }
};

export const logTextChange = (from: number, to: number, insert?: string, deleted?: boolean) => {
  integrationLogger.debug('change', 'Applying text change', {
    from,
    to,
    insert: insert?.substring(0, 50),
    deleted,
  });
};

export const logError = (category: string, error: Error | string, context?: any) => {
  integrationLogger.error(
    category,
    typeof error === 'string' ? error : error.message,
    typeof error === 'object' ? { ...context, stack: error.stack } : context
  );
};
