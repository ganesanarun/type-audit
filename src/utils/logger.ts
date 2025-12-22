/**
 * Internal logging utility for audit errors
 * Provides non-disruptive error logging for debugging purposes
 */

/**
 * Log levels for audit operations
 */
export enum LogLevel {
    ERROR = 'ERROR',
    WARN = 'WARN',
    DEBUG = 'DEBUG'
}

/**
 * Configuration for audit logging
 */
interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    prefix: string;
}

/**
 * Default logger configuration
 * Logging is disabled by default to avoid disrupting operation
 */
const DEFAULT_CONFIG: LoggerConfig = {
    enabled: false, // Disabled by default for production use
    level: LogLevel.ERROR,
    prefix: '[Audit]'
};

/**
 * Internal logger for audit operations
 * Provides safe, non-disruptive error logging
 */
class AuditLogger {
    private config: LoggerConfig = {...DEFAULT_CONFIG};

    /**
     * Configure the logger settings
     */
    configure(config: Partial<LoggerConfig>): void {
        this.config = {...this.config, ...config};
    }

    /**
     * Log an error during audit operations
     * Never throws exceptions to avoid disrupting business logic
     */
    error(message: string, error?: unknown, context?: Record<string, unknown>): void {
        this.log(LogLevel.ERROR, message, error, context);
    }

    /**
     * Log a warning during audit operations
     */
    warn(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.WARN, message, undefined, context);
    }

    /**
     * Log debug information during audit operations
     */
    debug(message: string, context?: Record<string, unknown>): void {
        this.log(LogLevel.DEBUG, message, undefined, context);
    }

    /**
     * Internal logging implementation with error isolation
     */
    private log(level: LogLevel, message: string, error?: unknown, context?: Record<string, unknown>): void {
        try {
            // Only log if enabled and level is appropriate
            if (!this.config.enabled || !this.shouldLog(level)) {
                return;
            }

            const timestamp = new Date().toISOString();
            const prefix = `${this.config.prefix} [${level}] ${timestamp}`;
            const fullMessage = `${prefix}: ${message}`;

            // Choose the appropriate console method based on the level
            const consoleMethod = this.getConsoleMethod(level);

            if (error) {
                consoleMethod(fullMessage, error);
            } else {
                consoleMethod(fullMessage);
            }

            // Log context if provided
            if (context && Object.keys(context).length > 0) {
                consoleMethod(`${prefix}: Context:`, context);
            }

        } catch (loggingError) {
            // Logging should never disrupt operation
            // Silently ignore logging errors
        }
    }

    /**
     * Determine if a log level should be output
     */
    private shouldLog(level: LogLevel): boolean {
        const levelPriority = {
            [LogLevel.ERROR]: 3,
            [LogLevel.WARN]: 2,
            [LogLevel.DEBUG]: 1
        };

        return levelPriority[level] >= levelPriority[this.config.level];
    }

    /**
     * Get appropriate console method for log level
     */
    private getConsoleMethod(level: LogLevel): (...args: any[]) => void {
        switch (level) {
            case LogLevel.ERROR:
                return console.error;
            case LogLevel.WARN:
                return console.warn;
            case LogLevel.DEBUG:
            default:
                return console.log;
        }
    }
}

/**
 * Singleton logger instance for use throughout the library
 */
export const auditLogger = new AuditLogger();

/**
 * Enable audit logging for debugging purposes
 * Should be called by developers when they need to debug audit issues
 */
export function enableAuditLogging(level: LogLevel = LogLevel.ERROR): void {
    auditLogger.configure({enabled: true, level});
}

/**
 * Disable audit logging
 */
export function disableAuditLogging(): void {
    auditLogger.configure({enabled: false});
}