import {Injectable, Logger} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {EntityManager, Repository} from 'typeorm';
import {ChangeRecord} from '@snow-tzu/audit';
import {AuditLog} from '../entities/audit-log.entity';

export interface AuditLogFilter {
    entityType?: string;
    entityId?: number;
    transactionId?: string;
    limit?: number;
}

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(
        @InjectRepository(AuditLog)
        private auditLogRepository: Repository<AuditLog>,
    ) {
    }

    async saveAuditLogs(
        manager: EntityManager,
        entityType: string,
        entityId: number,
        changes: ChangeRecord[],
        transactionId?: string,
        userId?: string
    ): Promise<void> {
        if (changes.length === 0) {
            this.logger.debug(`No changes to save for ${entityType} ${entityId}`);
            return;
        }

        // Filter out meaningless changes (e.g., undefined → null conversions)
        const meaningfulChanges = changes.filter(change => {
            const oldSerialized = this.serializeValue(change.oldValue);
            const newSerialized = this.serializeValue(change.newValue);

            // Skip changes where serialized values are the same
            if (oldSerialized === newSerialized) {
                this.logger.debug(`Skipping meaningless change for ${change.field}: ${oldSerialized} → ${newSerialized}`);
                return false;
            }

            return true;
        });

        if (meaningfulChanges.length === 0) {
            this.logger.debug(`No meaningful changes to save for ${entityType} ${entityId} after filtering`);
            return;
        }

        this.logger.debug(`Saving ${meaningfulChanges.length} audit logs for ${entityType} ${entityId} (filtered from ${changes.length})`, {
            entityType,
            entityId,
            transactionId,
            changes: meaningfulChanges.map(c => ({
                field: c.field,
                hasOldValue: c.oldValue !== undefined,
                hasNewValue: c.newValue !== undefined
            }))
        });

        const auditLogs = meaningfulChanges.map(change => {
            const auditLog = new AuditLog();
            auditLog.entityType = entityType;
            auditLog.entityId = entityId;
            auditLog.fieldName = change.field;
            auditLog.oldValue = this.serializeValue(change.oldValue);
            auditLog.newValue = this.serializeValue(change.newValue);
            auditLog.transactionId = transactionId;
            auditLog.userId = userId;

            this.logger.debug(`📝 Audit log: ${entityType}.${change.field} changed`, {
                field: change.field,
                oldValue: auditLog.oldValue,
                newValue: auditLog.newValue,
                transactionId
            });

            return auditLog;
        });

        await manager.save(AuditLog, auditLogs);

        this.logger.log(`✅ Saved ${auditLogs.length} audit logs for ${entityType} ${entityId}`, {
            entityType,
            entityId,
            transactionId,
            savedLogs: auditLogs.length
        });
    }

    async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLog[]> {
        const query = this.auditLogRepository.createQueryBuilder('audit');

        if (filter.entityType) {
            query.andWhere('audit.entityType = :entityType', {entityType: filter.entityType});
        }

        if (filter.entityId) {
            query.andWhere('audit.entityId = :entityId', {entityId: filter.entityId});
        }

        if (filter.transactionId) {
            query.andWhere('audit.transactionId = :transactionId', {transactionId: filter.transactionId});
        }

        query.orderBy('audit.createdAt', 'DESC');

        if (filter.limit) {
            query.limit(filter.limit);
        }

        return query.getMany();
    }

    async getEntityAuditLogs(entityType: string, entityId: number): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: {entityType, entityId},
            order: {createdAt: 'DESC'}
        });
    }

    async getTransactionAuditLogs(transactionId: string): Promise<AuditLog[]> {
        return this.auditLogRepository.find({
            where: {transactionId},
            order: {createdAt: 'ASC'}
        });
    }

    private serializeValue(value: unknown): string | null {
        if (value === null || value === undefined) {
            return null;
        }

        if (typeof value === 'string') {
            return value;
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return String(value);
        }

        if (value instanceof Date) {
            return value.toISOString();
        }

        // For objects and arrays, serialize to JSON
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }
}