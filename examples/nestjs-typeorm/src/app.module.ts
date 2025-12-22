import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserModule} from './user/user.module';
import {AuditModule} from './audit/audit.module';
import {dataSourceOptions} from './config/data-source';
import {LoggingMiddleware} from './middleware/logging.middleware';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            ...dataSourceOptions,
            logging: false, // Disable TypeORM logging to prevent conflicts
        }),
        UserModule,
        AuditModule,
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(LoggingMiddleware).forRoutes('*');
    }
}