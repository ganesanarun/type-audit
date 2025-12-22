import {LoggerService, LogLevel} from '@nestjs/common';

export class SimpleLogger implements LoggerService {
    private logLevels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
    private context = 'App';

    log(message: any, context?: string) {
        this.printMessage(message, 'LOG', context);
    }

    error(message: any, trace?: string, context?: string) {
        this.printMessage(message, 'ERROR', context);
        if (trace) {
            console.error(trace);
        }
    }

    warn(message: any, context?: string) {
        this.printMessage(message, 'WARN', context);
    }

    debug(message: any, context?: string) {
        if (process.env.LOG_LEVEL === 'debug') {
            this.printMessage(message, 'DEBUG', context);
        }
    }

    verbose(message: any, context?: string) {
        if (process.env.LOG_LEVEL === 'verbose') {
            this.printMessage(message, 'VERBOSE', context);
        }
    }

    private printMessage(message: any, level: string, context?: string) {
        const timestamp = new Date().toLocaleTimeString();
        const ctx = context || this.context;
        const colors = {
            LOG: '\x1b[36m',     // cyan
            ERROR: '\x1b[31m',   // red
            WARN: '\x1b[33m',    // yellow
            DEBUG: '\x1b[35m',   // magenta
            VERBOSE: '\x1b[37m', // white
        };

        const color = colors[level] || '\x1b[37m';
        const reset = '\x1b[0m';

        console.log(`\x1b[90m${timestamp}${reset} ${color}[${level}]${reset} \x1b[32m[${ctx}]${reset} ${message}`);
    }
}