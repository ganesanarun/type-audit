import {DataSource, DataSourceOptions} from 'typeorm';
import {User} from '../entities/user.entity';
import {Company} from '../entities/company.entity';
import {AuditLog} from '../entities/audit-log.entity';

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'audit_db',
    entities: [User, Company, AuditLog],
    migrations: ['dist/migrations/*.js'],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;