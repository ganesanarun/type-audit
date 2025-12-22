import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Auditable, AuditIgnore} from '@snow-tzu/audit';
import {User} from './user.entity';

@Entity('companies')
@Auditable()
export class Company {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 200})
    name: string = undefined as any;

    @Column({length: 100, nullable: true})
    industry?: string = undefined;

    @Column({length: 500, nullable: true})
    description?: string = undefined;

    @Column({default: true})
    isActive: boolean = undefined as any;

    @OneToMany(() => User, user => user.company)
    users: User[];

    @AuditIgnore()
    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt: Date;
}