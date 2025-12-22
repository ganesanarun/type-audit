import {Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn} from 'typeorm';
import {Auditable, AuditField, AuditIgnore} from '@snow-tzu/audit';
import {Company} from './company.entity';

@Entity('users')
@Auditable()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 100})
    name: string = undefined as any;

    @Column({length: 150, unique: true})
    email: string = undefined as any;

    @Column({nullable: true})
    phone?: string = undefined;

    @Column({default: true})
    isActive: boolean = undefined as any;

    @ManyToOne(() => Company, {nullable: true})
    @JoinColumn({name: 'company_id'})
    @AuditField()
    company?: Company;

    @AuditIgnore()
    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    lastLogin: Date;

    @AuditIgnore()
    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
    updatedAt: Date;
}