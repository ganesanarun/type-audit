import {WinstonModule} from 'nest-winston';
import * as winston from 'winston';

const consoleFormat = winston.format.combine(
    winston.format.timestamp({format: 'HH:mm:ss'}),
    winston.format.errors({stack: true}),
    winston.format.printf(({timestamp, level, message, context, trace, ...meta}) => {
        const levelColor = {
            error: '\x1b[31m',   // red
            warn: '\x1b[33m',    // yellow
            info: '\x1b[36m',    // cyan
            debug: '\x1b[35m',   // magenta
        }[level] || '\x1b[37m'; // white

        const reset = '\x1b[0m';
        const contextStr = context ? `\x1b[32m[${context}]\x1b[0m ` : '';

        let log = `\x1b[90m${timestamp}${reset} ${levelColor}[${level.toUpperCase()}]${reset} ${contextStr}${message}`;

        if (Object.keys(meta).length > 0) {
            log += ` \x1b[90m${JSON.stringify(meta)}${reset}`;
        }

        if (trace) {
            log += `\n${trace}`;
        }

        return log;
    })
);

const fileFormat = winston.format.combine(
    winston.format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    winston.format.errors({stack: true}),
    winston.format.json()
);

export const createLogger = () => {
    return WinstonModule.createLogger({
        level: process.env.LOG_LEVEL || 'info',
        transports: [
            new winston.transports.Console({
                format: consoleFormat,
                silent: false
            }),
            new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
                format: fileFormat
            }),
            new winston.transports.File({
                filename: 'logs/combined.log',
                format: fileFormat
            })
        ]
    });
};