import {Module} from '@nestjs/common';
import {TypeOrmModule} from '@nestjs/typeorm';
import {UserController} from './user.controller';
import {UserService} from './user.service';
import {User} from '../entities/user.entity';
import {Company} from '../entities/company.entity';
import {AuditModule} from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Company]),
        AuditModule,
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {
}