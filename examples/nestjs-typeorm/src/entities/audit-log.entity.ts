import {Column, Entity, Index, PrimaryGeneratedColumn} from 'typeorm';

@Entity('audit_logs')
@Index(['entityType', 'entityId'])
@Index(['transactionId'])
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({length: 50})
    entityType: string;

    @Column()
    entityId: number;

    @Column({length: 100})
    fieldName: string;

    @Column({type: 'text', nullable: true})
    oldValue?: string;

    @Column({type: 'text', nullable: true})
    newValue?: string;

    @Column({length: 100, nullable: true})
    transactionId?: string;

    @Column({length: 100, nullable: true})
    userId?: string;

    @Column({type: 'timestamp', default: () => 'CURRENT_TIMESTAMP'})
    createdAt: Date;
}