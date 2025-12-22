import {NestFactory} from '@nestjs/core';
import {Logger} from '@nestjs/common';
import {AppModule} from './app.module';
import {SimpleLogger} from './config/simple-logger.config';
import {enableAuditLogging, LogLevel} from '@snow-tzu/audit';

async function bootstrap() {
    // Create app with simple logger to avoid conflicts
    const app = await NestFactory.create(AppModule, {
        logger: new SimpleLogger(),
    });

    const logger = new Logger('Bootstrap');

    // Enable audit library logging in development
    if (process.env.NODE_ENV === 'development') {
        enableAuditLogging(LogLevel.DEBUG);
        logger.log('🔍 Audit library logging enabled (DEBUG level)');
    }

    // Enable CORS for development
    app.enableCors();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 NestJS Audit Example running on http://localhost:${port}`);
    logger.log('📊 Try the API endpoints to see audit tracking in action!');
    logger.log('📝 Check logs/ directory for detailed audit logs');

    // Log available endpoints
    logger.log('Available endpoints:');
    logger.log('  POST /users - Create user with company');
    logger.log('  PUT /users/:id - Update user');
    logger.log('  GET /users - Get all users');
    logger.log('  GET /audit-logs - Get audit logs');
}

bootstrap().catch(err => {
    const logger = new Logger('Bootstrap');
    logger.error('Failed to start application', err);
    process.exit(1);
});