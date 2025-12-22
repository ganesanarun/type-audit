import {Injectable, Logger, NestMiddleware} from '@nestjs/common';
import {NextFunction, Request, Response} from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        const {method, originalUrl, ip} = req;
        const userAgent = req.get('User-Agent') || '';
        const startTime = Date.now();

        this.logger.log(`📥 ${method} ${originalUrl} - ${ip} - ${userAgent}`);

        res.on('finish', () => {
            const {statusCode} = res;
            const duration = Date.now() - startTime;
            const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';

            this.logger.log(
                `📤 ${statusEmoji} ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
                {
                    method,
                    url: originalUrl,
                    statusCode,
                    duration,
                    ip,
                    userAgent: userAgent.substring(0, 100) // Truncate long user agents
                }
            );
        });

        next();
    }
}